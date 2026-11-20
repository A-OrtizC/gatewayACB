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

const appModule = require("../src/app");
const CommunicationError = require("../src/logic/errors/CommunicationError");
const app = appModule.createApp;

const TRACKING_ID = "3q2-7wV1z8Yk0pQr5sT6uA7bC8dE9fG0h";
const guideToken = jwt.sign(
  { sub: "21", role: "GUIDE" },
  process.env.ACB_JWT_SECRET,
  { algorithm: "HS256" }
);
const AUTH = { authorization: `Bearer ${guideToken}` };

test("API HTTP de seguimiento GPS", async (t) => {
  const calls = [];
  const gpsService = {
    createTrackingSession: async (...args) => {
      calls.push(["createTrackingSession", ...args]);
      const [, idempotencyKey] = args;
      if (idempotencyKey === "replay-key") {
        return {
          status: 200,
          body: { tracking_id: TRACKING_ID, session: {}, credential_status: "replayed" },
        };
      }
      return {
        status: 201,
        body: {
          tracking_id: TRACKING_ID,
          session: { id: TRACKING_ID },
          observation_credential: "session-token",
          credential_status: "issued",
        },
      };
    },
    getTrackingSession: async (trackingId, headers, correlationId) => {
      calls.push(["getTrackingSession", trackingId, headers, correlationId]);
      if (trackingId === "unauthorized") {
        throw new CommunicationError({
          type: "UNAUTHORIZED",
          code: "MS_GPS_401",
          status: 401,
          message: "No autorizado",
          service: "gps",
          upstreamCode: "unauthorized",
          upstreamHeaders: { "WWW-Authenticate": "Bearer" },
        });
      }
      if (trackingId === "unavailable") {
        throw new CommunicationError({
          type: "UPSTREAM",
          code: "MS_GPS_503",
          status: 503,
          message: "Servicio no disponible",
          service: "gps",
          upstreamCode: "temporarily_unavailable",
          upstreamHeaders: { "Retry-After": "1" },
        });
      }
      return { session: { id: trackingId, state: "active" } };
    },
    getTrackingSessionControl: async () => ({ session: { id: TRACKING_ID } }),
    listTrackingSessionPositions: async (...args) => {
      calls.push(["listTrackingSessionPositions", ...args]);
      return { tracking_id: args[0], positions: [] };
    },
    getLatestPosition: async () => null,
    registerObservation: async (...args) => {
      calls.push(["registerObservation", ...args]);
      return {
        status: 200,
        body: {
          tracking_id: args[0],
          sequence: 14,
          acceptance: "replayed",
        },
      };
    },
    disableTrackingSession: async () => ({ session: { state: "finished" } }),
    finishTrackingSession: async () => ({ session: { state: "finished" } }),
  };

  const server = app({ gpsService }).listen(0);
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  );
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  await t.test("exige JWT válido y rol GUIDE para crear", async () => {
    const missing = await fetch(`${baseUrl}/api/v1/tracking-sessions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "idem-auth",
      },
      body: JSON.stringify({
        trip_id: "12",
        guide_id: "21",
        geo_route_id: "route-1",
        policy_id: "client-policy",
      }),
    });
    assert.equal(missing.status, 401);
    assert.equal((await missing.json()).error.code, "UNAUTHORIZED");

    const managerToken = jwt.sign(
      { sub: "21", role: "MANAGER" },
      process.env.ACB_JWT_SECRET,
      { algorithm: "HS256" }
    );
    const forbidden = await fetch(`${baseUrl}/api/v1/tracking-sessions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${managerToken}`,
        "content-type": "application/json",
        "idempotency-key": "idem-role",
      },
      body: JSON.stringify({
        trip_id: "12",
        guide_id: "21",
        geo_route_id: "route-1",
        policy_id: "client-policy",
      }),
    });
    assert.equal(forbidden.status, 403);
    assert.equal((await forbidden.json()).error.code, "FORBIDDEN");
  });

  await t.test("crea con 201 y replay con 200", async () => {
    const created = await fetch(`${baseUrl}/api/v1/tracking-sessions`, {
      method: "POST",
      headers: {
        ...AUTH,
        "content-type": "application/json",
        "idempotency-key": "idem-1",
        "x-correlation-id": "gps-create",
      },
      body: JSON.stringify({
        trip_id: "12",
        guide_id: "21",
        geo_route_id: "route-1",
        policy_id: "policy-1",
      }),
    });

    assert.equal(created.status, 201);
    const body = await created.json();
    assert.equal(body.tracking_id, TRACKING_ID);
    const [name, payload, key, headers, correlationId] = calls.at(-1);
    assert.equal(name, "createTrackingSession");
    assert.equal(payload.trip_id, "12");
    assert.equal(payload.guide_id, "21");
    assert.equal(payload.policy_id, "policy-1");
    assert.equal(key, "idem-1");
    assert.equal(headers["x-correlation-id"], "gps-create");
    assert.equal(correlationId, "gps-create");

    const replay = await fetch(`${baseUrl}/api/v1/tracking-sessions`, {
      method: "POST",
      headers: {
        ...AUTH,
        "content-type": "application/json",
        "idempotency-key": "replay-key",
      },
      body: JSON.stringify({
        trip_id: "12",
        guide_id: "21",
        geo_route_id: "route-1",
        policy_id: "policy-1",
      }),
    });
    assert.equal(replay.status, 200);
    assert.equal((await replay.json()).credential_status, "replayed");
  });

  await t.test("exige Idempotency-Key válida", async () => {
    const missing = await fetch(`${baseUrl}/api/v1/tracking-sessions`, {
      method: "POST",
      headers: { ...AUTH, "content-type": "application/json" },
      body: JSON.stringify({ trip_id: "12" }),
    });
    assert.equal(missing.status, 400);
    assert.equal((await missing.json()).error.code, "INVALID_REQUEST");

    const tooLong = await fetch(`${baseUrl}/api/v1/tracking-sessions`, {
      method: "POST",
      headers: {
        ...AUTH,
        "content-type": "application/json",
        "idempotency-key": "k".repeat(257),
      },
      body: JSON.stringify({ trip_id: "12" }),
    });
    assert.equal(tooLong.status, 400);
  });

  await t.test("acepta ids opacos y observaciones con Bearer de sesión", async () => {
    const state = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/${TRACKING_ID}`,
      { headers: { ...AUTH, "x-correlation-id": "gps-state" } }
    );
    assert.equal(state.status, 200);
    assert.deepEqual(await state.json(), {
      session: { id: TRACKING_ID, state: "active" },
    });

    const observation = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/${TRACKING_ID}/observations`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer session-token",
        },
        body: JSON.stringify({
          sequence: 14,
          latitude: 4.711,
          longitude: -74.0721,
          accuracy_m: 12.5,
          captured_at: "2026-11-17T11:30:00Z",
        }),
      }
    );

    assert.equal(observation.status, 200);
    assert.equal((await observation.json()).acceptance, "replayed");
    const [, trackingId, payload, headers] = calls.at(-1);
    assert.equal(trackingId, TRACKING_ID);
    assert.equal(payload.sequence, 14);
    assert.equal(headers.authorization, "Bearer session-token");
  });

  await t.test("pagina posiciones con el contrato de Go", async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/${TRACKING_ID}/positions?after_sequence=3&limit=25`,
      { headers: AUTH }
    );
    assert.equal(response.status, 200);
    const [name, trackingId, query] = calls.at(-1);
    assert.equal(name, "listTrackingSessionPositions");
    assert.equal(trackingId, TRACKING_ID);
    assert.deepEqual(query, { after_sequence: 3, limit: 25 });

    const defaults = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/${TRACKING_ID}/positions`,
      { headers: AUTH }
    );
    assert.equal(defaults.status, 200);
    assert.deepEqual(calls.at(-1)[2], {
      after_sequence: null,
      limit: null,
    });
  });

  await t.test("rechaza paginación inválida", async () => {
    const tooLarge = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/${TRACKING_ID}/positions?limit=101`,
      { headers: AUTH }
    );
    assert.equal(tooLarge.status, 400);

    const unknown = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/${TRACKING_ID}/positions?page=1`,
      { headers: AUTH }
    );
    assert.equal(unknown.status, 400);

    const negative = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/${TRACKING_ID}/positions?after_sequence=-1`,
      { headers: AUTH }
    );
    assert.equal(negative.status, 400);
  });

  await t.test("devuelve 204 si no hay última posición", async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/${TRACKING_ID}/latest-position`,
      { headers: AUTH }
    );
    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
  });

  await t.test("rechaza ids de seguimiento inválidos", async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/${"a".repeat(257)}`,
      { headers: AUTH }
    );
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "INVALID_REQUEST");
  });

  await t.test("conserva código y headers del GPS", async () => {
    const unauthorized = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/unauthorized`,
      { headers: AUTH }
    );
    assert.equal(unauthorized.status, 401);
    assert.equal(
      unauthorized.headers.get("www-authenticate"),
      "Bearer"
    );
    assert.equal((await unauthorized.json()).error.code, "unauthorized");

    const unavailable = await fetch(
      `${baseUrl}/api/v1/tracking-sessions/unavailable`,
      { headers: AUTH }
    );
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get("retry-after"), "1");
    assert.equal(
      (await unavailable.json()).error.code,
      "temporarily_unavailable"
    );
  });
});
