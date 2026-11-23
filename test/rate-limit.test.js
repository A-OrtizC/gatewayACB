const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const jwt = require("jsonwebtoken");

process.env.PATHS_SERVICE_URL = "http://paths.test";
process.env.OPERATIONS_SERVICE_URL = "http://operations.test";
process.env.ROUTES_SERVICE_URL = "http://routes.test";
process.env.GPS_SERVICE_URL = "http://gps.test";
process.env.ACB_JWT_SECRET = "test-jwt-secret-0123456789abcdef";
process.env.GPS_POLICY_ID = "policy-1";
delete process.env.RATE_LIMIT_WINDOW_MS;
delete process.env.RATE_LIMIT_MAX;
delete process.env.RATE_LIMIT_LOGIN_MAX;
delete process.env.TRUST_PROXY;

const { createApp } = require("../src/app");
const rateLimitConfig = require("../src/config/rateLimit");

function tokenFor(sub, secret = process.env.ACB_JWT_SECRET) {
  return jwt.sign({ sub, role: "GUIDE" }, secret, { algorithm: "HS256" });
}

async function startApp(rateLimit) {
  const calls = [];
  const record = (name, value = { ok: true }) => async (...args) => {
    calls.push([name, ...args]);
    return value;
  };
  const server = createApp({
    rateLimit,
    pathsService: { findAll: record("findAll") },
    authService: { login: record("login", { token: "app-jwt" }) },
    gpsService: {
      getTrackingSession: record("getTrackingSession"),
      registerObservation: record("registerObservation", {
        status: 201,
        body: { accepted: true },
      }),
    },
  }).listen(0);
  await once(server, "listening");
  return {
    calls,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

function login(baseUrl, path, username) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password: "secreto" }),
  });
}

function postObservation(baseUrl, trackingId) {
  return fetch(`${baseUrl}/api/v1/tracking-sessions/${trackingId}/observations`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer gps-session-token",
    },
    body: JSON.stringify({ lat: 4.6, lng: -74.08 }),
  });
}

test("rechaza con 429 al superar el límite general", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const harness = await startApp({ max: 2 });
  t.after(() => harness.close());

  for (let i = 0; i < 2; i++) {
    const allowed = await fetch(`${harness.baseUrl}/api/v1/routes`);
    assert.equal(allowed.status, 200);
  }

  const rejected = await fetch(`${harness.baseUrl}/api/v1/routes`, {
    headers: { "x-correlation-id": "limit-1" },
  });
  assert.equal(rejected.status, 429);
  const retryAfter = Number(rejected.headers.get("retry-after"));
  assert.ok(retryAfter > 0 && retryAfter <= 60);
  assert.deepEqual(await rejected.json(), {
    error: {
      code: "RATE_LIMITED",
      message: `Demasiadas solicitudes. Intenta de nuevo en ${retryAfter} segundos.`,
      correlationId: "limit-1",
    },
  });
  assert.equal(harness.calls.length, 2);
  assert.equal(warn.mock.callCount(), 1);
  assert.equal(
    warn.mock.calls[0].arguments[0],
    "[gateway] limit-1 RATE_LIMITED GET /api/v1/routes ip"
  );
});

test("cada usuario JWT tiene su propio conteo y un JWT inválido cuenta por IP", async (t) => {
  t.mock.method(console, "warn", () => {});
  const harness = await startApp({ max: 2 });
  t.after(() => harness.close());

  const get = (token) =>
    fetch(`${harness.baseUrl}/api/v1/tracking-sessions/trk-1`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });

  const first = tokenFor("21");
  assert.equal((await get(first)).status, 200);
  assert.equal((await get(first)).status, 200);
  assert.equal((await get(first)).status, 429);
  assert.equal((await get(tokenFor("22"))).status, 200);

  const forged = tokenFor("21", "otro-secreto");
  assert.equal((await get(forged)).status, 401);
  assert.equal((await get(forged)).status, 401);
  assert.equal((await get(forged)).status, 429);
  assert.equal((await get()).status, 429);
});

test("cada sesión de tracking tiene su propio conteo de observaciones", async (t) => {
  t.mock.method(console, "warn", () => {});
  const harness = await startApp({ max: 2 });
  t.after(() => harness.close());

  assert.equal((await postObservation(harness.baseUrl, "session-a")).status, 201);
  assert.equal((await postObservation(harness.baseUrl, "session-a")).status, 201);
  assert.equal((await postObservation(harness.baseUrl, "session-a")).status, 429);
  assert.equal((await postObservation(harness.baseUrl, "session-b")).status, 201);
  assert.equal(
    harness.calls.filter(([name]) => name === "registerObservation").length,
    3
  );
});

test("el login se limita por IP y usuario en ambas rutas", async (t) => {
  t.mock.method(console, "warn", () => {});
  const harness = await startApp({ loginMax: 2 });
  t.after(() => harness.close());

  assert.equal((await login(harness.baseUrl, "/api/v1/auth/login", "Ana")).status, 200);
  assert.equal(
    (await login(harness.baseUrl, "/api/v1/admin/auth/login", " ana ")).status,
    200
  );

  const rejected = await login(harness.baseUrl, "/api/v1/auth/login", "ANA");
  assert.equal(rejected.status, 429);
  assert.equal((await rejected.json()).error.code, "RATE_LIMITED");
  assert.ok(rejected.headers.get("retry-after"));

  assert.equal(
    (await login(harness.baseUrl, "/api/v1/admin/auth/login", "luis")).status,
    200
  );
  assert.equal(harness.calls.filter(([name]) => name === "login").length, 3);
});

test("la IP del cliente sale de X-Forwarded-For detrás de un proxy de confianza", async (t) => {
  t.mock.method(console, "warn", () => {});
  const harness = await startApp({ max: 1 });
  t.after(() => harness.close());

  const get = (ip) =>
    fetch(`${harness.baseUrl}/api/v1/routes`, { headers: { "x-forwarded-for": ip } });

  assert.equal((await get("203.0.113.10")).status, 200);
  assert.equal((await get("203.0.113.10")).status, 429);
  assert.equal((await get("203.0.113.20")).status, 200);
});

test("GET /api/v1/health nunca se limita", async (t) => {
  const harness = await startApp({ max: 1 });
  t.after(() => harness.close());

  for (let i = 0; i < 5; i++) {
    const health = await fetch(`${harness.baseUrl}/api/v1/health`);
    assert.equal(health.status, 200);
  }
  assert.equal((await fetch(`${harness.baseUrl}/api/v1/routes`)).status, 200);
});

test("sin opciones usa los valores por defecto de la configuración", async (t) => {
  assert.equal(rateLimitConfig.windowMs, 60000);
  assert.equal(rateLimitConfig.max, 120);
  assert.equal(rateLimitConfig.loginMax, 5);

  const harness = await startApp();
  t.after(() => harness.close());

  const general = await fetch(`${harness.baseUrl}/api/v1/routes`);
  assert.equal(general.headers.get("ratelimit-policy"), "120;w=60");

  const loginResponse = await login(harness.baseUrl, "/api/v1/auth/login", "ana");
  assert.equal(loginResponse.headers.get("ratelimit-policy"), "5;w=60");
});
