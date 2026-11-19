const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");

process.env.AUTH_SERVICE_URL = "http://auth.test";
process.env.USERS_SERVICE_URL = "http://users.test";
process.env.OPERATIONS_SERVICE_URL = "http://operations.test";
process.env.ROUTES_SERVICE_URL = "http://routes.test";
process.env.PATHS_SERVICE_URL = "http://paths.test";
process.env.GPS_SERVICE_URL = "http://gps.test";

const { createApp } = require("../src/app");

async function startApp(services) {
  const server = createApp(services).listen(0);
  await once(server, "listening");
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

test("el detalle de estudiantes une matrícula, admin_users y puntos", async (t) => {
  const calls = [];
  const record = (name, value) => async (...args) => {
    calls.push([name, ...args]);
    return typeof value === "function" ? value(...args) : value;
  };
  const routesService = {
    listStudentsByRoute: record("listStudentsByRoute", [
      { studentId: 12, name: "Ana", active: true, routeId: 7, routeCode: "MM04" },
      { studentId: 13, name: "Luis", active: true, routeId: 7, routeCode: "MM04" },
    ]),
    listRouteStudentsMeetingPoints: record("listRouteStudentsMeetingPoints", [
      { studentId: 12, shiftCode: "541", meetingPointCode: "MP03" },
      { studentId: 12, shiftCode: "542", meetingPointCode: "MP01" },
    ]),
    getStudent: record("getStudent", { studentId: 13, routeId: 7, active: true }),
    getStudentMeetingPoints: record("getStudentMeetingPoints", []),
  };
  const usersService = {
    listStudents: record("listStudents", {
      content: [
        {
          userId: 12,
          name: "Ana",
          documentType: "NUIP",
          documentNumber: "123",
          grade: "6",
          schoolShift: "MORNING",
          section: "A",
          schoolId: 3,
          guardians: [
            { userId: 90, name: "Marta", phone: "300", relationship: "MOTHER", isPrimary: true },
          ],
        },
      ],
    }),
    getStudent: record("getStudent", {
      userId: 13,
      name: "Luis",
      documentType: "CC",
      grade: "7",
    }),
  };
  const harness = await startApp({ routesService, usersService });
  t.after(() => harness.close());

  const response = await fetch(`${harness.baseUrl}/api/v1/admin/routes/7/students`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.length, 2);
  assert.deepEqual(body[0].meetingPoints, { "541": "MP03", "542": "MP01" });
  assert.equal(body[0].grade, "6");
  assert.equal(body[0].guardians[0].primary, true);
  assert.deepEqual(body[1].meetingPoints, { "541": null, "542": null });
  assert.equal(body[1].name, "Luis");
});

test("la matrícula crea el usuario, la ruta y los puntos en orden", async (t) => {
  const calls = [];
  const record = (name, value) => async (...args) => {
    calls.push([name, ...args]);
    return typeof value === "function" ? value(...args) : value;
  };
  const routesService = {
    getRoute: record("getRoute", { routeId: 7, schoolId: 3 }),
    listMeetingPointsForRoute: record("listMeetingPointsForRoute", [
      { meetingPointId: 41, meetingPointCode: "MP03" },
      { meetingPointId: 42, meetingPointCode: "MP01" },
    ]),
    assignStudentToRoute: record("assignStudentToRoute", { studentId: 12 }),
    assignStudentMeetingPoints: record("assignStudentMeetingPoints", []),
    getStudent: record("getStudent", { studentId: 12, routeId: 7, active: true }),
    getStudentMeetingPoints: record("getStudentMeetingPoints", []),
  };
  const usersService = {
    createStudent: record("createStudent", { userId: 12, name: "Ana" }),
    getStudent: record("getStudent", { userId: 12, name: "Ana", grade: "6" }),
  };
  const harness = await startApp({ routesService, usersService });
  t.after(() => harness.close());

  const response = await fetch(`${harness.baseUrl}/api/v1/admin/routes/7/students`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      user: {
        documentType: "NUIP",
        documentNumber: "123",
        name: "Ana",
        address: "Calle 1",
        phone: "3001234567",
      },
      student: { grade: "6", schoolShift: "MORNING", section: "A" },
      meetingPoints: { "541": "MP03", "542": "MP01" },
    }),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(
    calls.slice(0, 6).map((call) => call[0]),
    [
      "getRoute",
      "createStudent",
      "assignStudentToRoute",
      "listMeetingPointsForRoute",
      "assignStudentMeetingPoints",
      "getStudent",
    ]
  );
  const created = calls.find((call) => call[0] === "createStudent");
  assert.equal(created[1].user.role, "STUDENT");
  assert.equal(created[1].student.schoolId, 3);
  const assigned = calls.find((call) => call[0] === "assignStudentToRoute");
  assert.equal(assigned[1], "7");
  assert.deepEqual(assigned[2], { studentId: 12, name: "Ana" });
  const points = calls.find((call) => call[0] === "assignStudentMeetingPoints");
  assert.deepEqual(points[2], {
    assignments: [
      { shiftCode: "541", meetingPointId: 41 },
      { shiftCode: "542", meetingPointId: 42 },
    ],
  });
});

test("la asistencia inicializa el padrón y marca presente o ausente", async (t) => {
  const calls = [];
  const record = (name, value) => async (...args) => {
    calls.push([name, ...args]);
    return typeof value === "function" ? value(...args) : value;
  };
  const operationsService = {
    initializeRoster: record("initializeRoster", []),
    registerOrUpdateAttendance: record("registerOrUpdateAttendance", {}),
  };
  const harness = await startApp({ operationsService });
  t.after(() => harness.close());

  const response = await fetch(`${harness.baseUrl}/api/v1/admin/trips/9/attendance`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      records: [
        { studentId: 12, studentName: "Ana", present: true },
        { studentId: 13, studentName: "Luis", present: false },
      ],
    }),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { saved: 2 });
  assert.equal(calls[0][0], "initializeRoster");
  assert.equal(calls[0][1], "9");
  assert.deepEqual(calls[0][2], [
    { studentId: 12, studentName: "Ana" },
    { studentId: 13, studentName: "Luis" },
  ]);
  const updates = calls.filter((call) => call[0] === "registerOrUpdateAttendance");
  assert.equal(updates.length, 2);
  assert.equal(updates[0][2], 12);
  assert.equal(updates[0][3].statusCode, "01");
  assert.equal(updates[1][3].statusCode, "00");
});

test("el historial de asistencia normaliza el estado", async (t) => {
  const operationsService = {
    listAttendanceByRoute: async () => [
      {
        date: "2026-11-18",
        tripCode: "541",
        tripId: 9,
        studentId: 12,
        studentName: "Ana",
        statusCode: "01",
      },
      {
        date: "2026-11-18",
        tripCode: "541",
        tripId: 9,
        studentId: 13,
        studentName: "Luis",
        statusCode: "00",
      },
    ],
  };
  const harness = await startApp({ operationsService });
  t.after(() => harness.close());

  const response = await fetch(
    `${harness.baseUrl}/api/v1/admin/routes/7/attendance?from=2026-11-01&to=2026-11-19`
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body[0].present, true);
  assert.equal(body[1].present, false);
  assert.equal(body[0].tripCode, "541");
});

test("el listado de viajes se normaliza al contrato de la UI", async (t) => {
  const operationsService = {
    listTripsByDate: async () => [
      {
        tripId: 9,
        routeId: 7,
        routeCodeSnapshot: "MM04",
        shiftCodeSnapshot: "541",
        tripDate: "2026-11-19",
        schoolNameSnapshot: "Colegio",
        scheduledStartSnapshot: "06:00:00",
        actualStartAt: null,
        actualEndAt: null,
      },
    ],
    listTripGuides: async () => [
      {
        tripGuideId: 1,
        assignmentRole: "MAIN",
        plannedGuideId: 3,
        plannedGuideNameSnapshot: "Guía",
      },
    ],
  };
  const harness = await startApp({ operationsService });
  t.after(() => harness.close());

  const response = await fetch(
    `${harness.baseUrl}/api/v1/admin/trips?date=2026-11-19`
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, [
    {
      id: 9,
      routeId: 7,
      routeCode: "MM04",
      tripCode: "541",
      date: "2026-11-19",
      schoolName: "Colegio",
      scheduledStart: "06:00:00",
      citationTime: "06:00:00",
      requiredGuides: 1,
      status: "SCHEDULED",
      startedAt: null,
      endedAt: null,
      guides: [{ guideId: 3, name: "Guía", primary: true }],
      executors: [],
    },
  ]);
});
