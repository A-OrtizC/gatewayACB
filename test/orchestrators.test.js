const assert = require("node:assert/strict");
const test = require("node:test");

const createTripsOrchestrator = require("../src/logic/orchestrators/trips.orchestrator");
const createRoutesOrchestrator = require("../src/logic/orchestrators/routes.orchestrator");
const NotFoundError = require("../src/logic/errors/NotFoundError");

test("trips.orchestrator compone viaje, guías, asistencia y eventos", async () => {
  const calls = [];
  const service = {
    getTrip: async (...args) => {
      calls.push(["getTrip", ...args]);
      return { id: args[0] };
    },
    listTripGuides: async (...args) => {
      calls.push(["listTripGuides", ...args]);
      return [{ id: "guide-1" }];
    },
    listStudentAttendance: async (...args) => {
      calls.push(["listStudentAttendance", ...args]);
      return [{ studentId: 42 }];
    },
    listTripEvents: async (...args) => {
      calls.push(["listTripEvents", ...args]);
      return [{ id: "event-1" }];
    },
  };

  const orchestrator = createTripsOrchestrator(service);
  const result = await orchestrator.getOverview(
    "12",
    { authorization: "Bearer token" },
    "corr-1"
  );

  assert.deepEqual(result, {
    trip: { id: "12" },
    guides: [{ id: "guide-1" }],
    attendance: [{ studentId: 42 }],
    events: [{ id: "event-1" }],
  });
  assert.deepEqual(
    calls.map((call) => call[0]).sort(),
    ["getTrip", "listStudentAttendance", "listTripEvents", "listTripGuides"]
  );
  assert.deepEqual(calls[0][2], { authorization: "Bearer token" });
});

test("routes.orchestrator compone ruta, puntos y estudiantes", async () => {
  const service = {
    getRoute: async () => ({ id: "3" }),
    listMeetingPointsForRoute: async () => [{ id: "8" }],
    listStudentsByRoute: async () => [{ id: "42" }],
  };

  const orchestrator = createRoutesOrchestrator(service);
  const result = await orchestrator.getOverview("3", {}, "corr-2");

  assert.deepEqual(result, {
    route: { id: "3" },
    meetingPoints: [{ id: "8" }],
    students: [{ id: "42" }],
  });
});

test("routes.orchestrator devuelve NotFoundError si la ruta no existe", async () => {
  const service = {
    getRoute: async () => null,
    listMeetingPointsForRoute: async () => [],
    listStudentsByRoute: async () => [],
  };

  const orchestrator = createRoutesOrchestrator(service);
  await assert.rejects(
    () => orchestrator.getOverview("999", {}, "corr-3"),
    (error) => error instanceof NotFoundError && error.status === 404
  );
});
