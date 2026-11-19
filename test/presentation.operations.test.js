const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");

process.env.PATHS_SERVICE_URL = "http://paths.test";
process.env.OPERATIONS_SERVICE_URL = "http://operations.test";
process.env.ROUTES_SERVICE_URL = "http://routes.test";
process.env.GPS_SERVICE_URL = "http://gps.test";

const appModule = require("../src/app");
const app = appModule.createApp;

test("API HTTP de operaciones", async (t) => {
  const calls = [];
  const record = (name, result) => async (...args) => {
    calls.push([name, ...args]);
    return typeof result === "function" ? result(...args) : result;
  };

  const operationsService = {
    createTrip: record("createTrip", { id: 12, status: "SCHEDULED" }),
    getTrip: record("getTrip", { id: 12 }),
    listTripGuides: record("listTripGuides", [{ id: 7 }]),
    replaceTripGuide: record("replaceTripGuide", { id: 7 }),
    getTripByRouteAndDate: record("getTripByRouteAndDate", { id: 12 }),
    startTrip: record("startTrip", { id: 12, status: "IN_PROGRESS" }),
    finishTrip: record("finishTrip", { id: 12, status: "FINISHED" }),
    listTripEvents: record("listTripEvents", [{ id: 31 }]),
    registerTripEvent: record("registerTripEvent", { id: 31 }),
    initializeRoster: record("initializeRoster", [{ studentId: 42 }]),
    listStudentAttendance: record("listStudentAttendance", [{ studentId: 42 }]),
    registerOrUpdateAttendance: record("registerOrUpdateAttendance", {
      studentId: 42,
    }),
    listGuideCheckIns: record("listGuideCheckIns", [{ id: 81 }]),
    listGuideFaultCycles: record("listGuideFaultCycles", [{ id: 5 }]),
    listMinorFaults: record("listMinorFaults", [{ id: 10 }]),
    getMajorFault: record("getMajorFault", { id: 9 }),
    markMinorFaultNotified: record("markMinorFaultNotified", { id: 10 }),
    markMajorFaultNotified: record("markMajorFaultNotified", { id: 9 }),
    markMajorFaultMinuted: record("markMajorFaultMinuted", null),
  };
  const tripsOrchestrator = {
    getOverview: async (...args) => {
      calls.push(["getOverview", ...args]);
      return {
        trip: { id: args[0] },
        guides: [],
        attendance: [],
        events: [],
      };
    },
  };

  const server = app({ operationsService, tripsOrchestrator }).listen(0);
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  );
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  await t.test("crea el viaje y reenvía contexto", async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/trips`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token",
        "x-correlation-id": "trip-create",
      },
      body: JSON.stringify({ routeId: 3, tripDate: "2026-11-17" }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { id: 12, status: "SCHEDULED" });
    const [name, body, headers, correlationId] = calls.at(-1);
    assert.equal(name, "createTrip");
    assert.deepEqual(body, { routeId: 3, tripDate: "2026-11-17" });
    assert.equal(headers.authorization, "Bearer token");
    assert.equal(headers["x-correlation-id"], "trip-create");
    assert.equal(correlationId, "trip-create");
  });

  await t.test("compone el resumen del viaje", async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/trips/12/overview`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      trip: { id: "12" },
      guides: [],
      attendance: [],
      events: [],
    });
    assert.equal(calls.at(-1)[0], "getOverview");
  });

  await t.test("el roster exige un arreglo JSON", async () => {
    const invalid = await fetch(
      `${baseUrl}/api/v1/admin/trips/12/attendance/roster`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId: 42 }),
      }
    );
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).error.code, "INVALID_REQUEST");

    const valid = await fetch(
      `${baseUrl}/api/v1/admin/trips/12/attendance/roster`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify([{ studentId: 42, studentName: "Juan" }]),
      }
    );
    assert.equal(valid.status, 201);
    assert.deepEqual(await valid.json(), [{ studentId: 42 }]);
    assert.equal(calls.at(-1)[0], "initializeRoster");
    assert.equal(calls.at(-1)[1], "12");
    assert.deepEqual(calls.at(-1)[2], [
      { studentId: 42, studentName: "Juan" },
    ]);
  });

  await t.test("finish no reenvía el cuerpo", async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/trips/12/finish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ occurredAt: "2026-11-17T11:30:00Z" }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      tripId: 12,
      startedAt: null,
      endedAt: null,
      durationMinutes: 0,
      presentCount: 0,
      enrolledCount: 1,
    });
    const finishCall = calls.find((call) => call[0] === "finishTrip");
    assert.equal(finishCall[1], "12");
    assert.equal(finishCall[2], undefined);
  });

  await t.test("minuted devuelve 204 y check-in de escritura no está expuesto", async () => {
    const minuted = await fetch(
      `${baseUrl}/api/v1/admin/guide-faults/major/9/minuted`,
      { method: "PUT" }
    );
    assert.equal(minuted.status, 204);
    assert.equal(await minuted.text(), "");

    const audit = await fetch(`${baseUrl}/api/v1/admin/trip-guides/7/check-ins`);
    assert.equal(audit.status, 200);
    assert.deepEqual(await audit.json(), [{ id: 81 }]);

    const hidden = await fetch(
      `${baseUrl}/api/v1/admin/internal/trip-guides/7/check-ins`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      }
    );
    assert.equal(hidden.status, 404);
    assert.equal((await hidden.json()).error.code, "ENDPOINT_NOT_FOUND");
  });

  await t.test("valida identificadores numéricos", async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/trips/abc`);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "INVALID_REQUEST");
  });
});
