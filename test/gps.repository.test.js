const assert = require("node:assert/strict");
const test = require("node:test");

process.env.GPS_SERVICE_URL = "http://gps.test";
process.env.PATHS_SERVICE_URL = "http://paths.test";
process.env.GPS_INTERNAL_TOKEN = "internal-token";

const gpsRepository = require("../src/data/repositories/gpsRepository");
const { HttpError } = require("../src/data/clients/httpClient");

function stubFetch() {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({}),
      text: async () => "",
    };
  };
  return {
    calls,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

test("gpsRepository respeta el contrato del componente Go", async (t) => {
  const stub = stubFetch();
  t.after(stub.restore);

  await t.test("consulta de estado usa el token interno", async () => {
    await gpsRepository.findTrackingSessions("session-1", { "x-correlation-id": "c-1" });
    const call = stub.calls.at(-1);
    assert.equal(call.options.method, "GET");
    assert.equal(call.url, "http://gps.test/api/v1/tracking-sessions/session-1");
    assert.equal(call.options.headers.Authorization, "Bearer internal-token");
    assert.equal(call.options.headers["x-correlation-id"], "c-1");
  });

  await t.test("la observacion conserva el Bearer de sesion", async () => {
    await gpsRepository.createTrackingSessionObservation(
      "session-1",
      { sequence: 1, latitude: 4.6, longitude: -74.1 },
      { Authorization: "Bearer session-token" }
    );
    const call = stub.calls.at(-1);
    assert.equal(call.options.method, "POST");
    assert.equal(call.url, "http://gps.test/api/v1/tracking-sessions/session-1/observations");
    assert.equal(call.options.headers.Authorization, "Bearer session-token");
    assert.deepEqual(JSON.parse(call.options.body), {
      sequence: 1,
      latitude: 4.6,
      longitude: -74.1,
    });
  });

  await t.test("las posiciones envian query y token interno", async () => {
    await gpsRepository.findTrackingSessionPositions("session-1", { after_sequence: 5, limit: 20 });
    const call = stub.calls.at(-1);
    const url = new URL(call.url);
    assert.equal(call.options.method, "GET");
    assert.equal(url.pathname, "/api/v1/tracking-sessions/session-1/positions");
    assert.equal(url.searchParams.get("after_sequence"), "5");
    assert.equal(url.searchParams.get("limit"), "20");
    assert.equal(call.options.headers.Authorization, "Bearer internal-token");
  });

  await t.test("la creacion envia Idempotency-Key y token interno", async () => {
    await gpsRepository.createTrackingSession(
      { trip_id: "trip-1", guide_id: "guide-1", geo_route_id: "route-1", policy_id: "policy-1" },
      "idem-1"
    );
    const call = stub.calls.at(-1);
    assert.equal(call.options.method, "POST");
    assert.equal(call.url, "http://gps.test/api/v1/tracking-sessions");
    assert.equal(call.options.headers["Idempotency-Key"], "idem-1");
    assert.equal(call.options.headers.Authorization, "Bearer internal-token");
  });

  await t.test("el alias de control usa GET", async () => {
    await gpsRepository.findTrackingSessionControl("session-1");
    const call = stub.calls.at(-1);
    assert.equal(call.options.method, "GET");
    assert.equal(call.url, "http://gps.test/api/v1/tracking-sessions/session-1/control");
    assert.equal(call.options.headers.Authorization, "Bearer internal-token");
  });

  await t.test("el alias de deshabilitacion usa PATCH sin cuerpo", async () => {
    await gpsRepository.disableTrackingSession("session-1");
    const call = stub.calls.at(-1);
    assert.equal(call.options.method, "PATCH");
    assert.equal(call.url, "http://gps.test/api/v1/tracking-sessions/session-1/disable");
    assert.equal(call.options.headers.Authorization, "Bearer internal-token");
    assert.equal(call.options.body, undefined);
  });
});

test("gpsRepository falla de forma explicita sin GPS_INTERNAL_TOKEN", async () => {
  const originalToken = process.env.GPS_INTERNAL_TOKEN;
  delete process.env.GPS_INTERNAL_TOKEN;
  try {
    await assert.rejects(
      () => gpsRepository.findTrackingSessionControl("session-1"),
      (error) =>
        error instanceof HttpError &&
        error.code === "SERVICE_NOT_CONFIGURED" &&
        error.service === "gps"
    );
  } finally {
    process.env.GPS_INTERNAL_TOKEN = originalToken;
  }
});

test("pathsRepository expone status/notify", async (t) => {
  const stub = stubFetch();
  t.after(stub.restore);

  const pathsRepository = require("../src/data/repositories/pathsRepository");
  await pathsRepository.notifyStatus({ route_id: "route-1", status: "active" }, { "x-correlation-id": "c-2" });

  const call = stub.calls.at(-1);
  assert.equal(call.options.method, "POST");
  assert.equal(call.url, "http://paths.test/api/v1/status/notify");
  assert.equal(call.options.headers["x-correlation-id"], "c-2");
  assert.deepEqual(JSON.parse(call.options.body), { route_id: "route-1", status: "active" });
});
