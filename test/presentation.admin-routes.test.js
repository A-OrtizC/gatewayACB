const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");

process.env.PATHS_SERVICE_URL = "http://paths.test";
process.env.OPERATIONS_SERVICE_URL = "http://operations.test";
process.env.ROUTES_SERVICE_URL = "http://routes.test";
process.env.GPS_SERVICE_URL = "http://gps.test";

const appModule = require("../src/app");
const app = appModule.createApp;

test("API HTTP de administración de rutas", async (t) => {
  const calls = [];
  const record = (name, result) => async (...args) => {
    calls.push([name, ...args]);
    return typeof result === "function" ? result(...args) : result;
  };

  const routesService = {
    listRoutes: record("listRoutes", [{ id: 3 }]),
    getRoute: record("getRoute", { id: 3 }),
    createRoute: record("createRoute", { id: 4 }),
    updateRoute: record("updateRoute", { id: 3 }),
    deactivateRoute: record("deactivateRoute", null),
    assignGuidesToRoute: record("assignGuidesToRoute", { id: 3 }),
    listMeetingPointsForRoute: record("listMeetingPointsForRoute", [{ id: 8 }]),
    getMeetingPoint: record("getMeetingPoint", { id: 8 }),
    createMeetingPoint: record("createMeetingPoint", { id: 8 }),
    updateMeetingPoint: record("updateMeetingPoint", { id: 8 }),
    deleteMeetingPoint: record("deleteMeetingPoint", null),
    getRosterAtMeetingPoint: record("getRosterAtMeetingPoint", [{ id: 42 }]),
    listStudentsByRoute: record("listStudentsByRoute", [{ id: 42 }]),
    assignStudentToRoute: record("assignStudentToRoute", { id: 42 }),
    getStudent: record("getStudent", { id: 42 }),
    updateStudent: record("updateStudent", { id: 42 }),
    deactivateStudent: record("deactivateStudent", null),
    getStudentMeetingPoints: record("getStudentMeetingPoints", [
      { shiftCode: "541", meetingPointId: 8 },
    ]),
    assignStudentMeetingPoints: record("assignStudentMeetingPoints", [
      { shiftCode: "541", meetingPointId: 8 },
    ]),
    listSchools: record("listSchools", [{ id: 2 }]),
    getSchool: record("getSchool", { id: 2 }),
    createSchool: record("createSchool", { id: 2 }),
    updateSchool: record("updateSchool", { id: 2 }),
    deactivateSchool: record("deactivateSchool", null),
  };
  const routesOrchestrator = {
    getOverview: async (...args) => {
      calls.push(["getOverview", ...args]);
      return {
        route: { id: args[0] },
        meetingPoints: [],
        students: [],
      };
    },
  };

  const server = app({ routesService, routesOrchestrator }).listen(0);
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  );
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  await t.test("lista rutas con filtros y crea una ruta", async () => {
    const list = await fetch(
      `${baseUrl}/api/v1/admin/routes?schoolId=2&zone=NORTE`,
      { headers: { authorization: "Bearer token", "x-correlation-id": "admin-1" } }
    );
    assert.equal(list.status, 200);
    assert.deepEqual(await list.json(), [{ id: 3 }]);
    const [name, schoolId, zone, headers, correlationId] = calls.at(-1);
    assert.equal(name, "listRoutes");
    assert.equal(schoolId, "2");
    assert.equal(zone, "NORTE");
    assert.equal(headers.authorization, "Bearer token");
    assert.equal(correlationId, "admin-1");

    const created = await fetch(`${baseUrl}/api/v1/admin/routes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ routeCode: "541", schoolId: 2 }),
    });
    assert.equal(created.status, 201);
    assert.deepEqual(await created.json(), { id: 4 });
  });

  await t.test("consulta el resumen administrativo", async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/routes/3/overview`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      route: { id: "3" },
      meetingPoints: [],
      students: [],
    });
    assert.equal(calls.at(-1)[0], "getOverview");
  });

  await t.test("elimina puntos y estudiantes con 204", async () => {
    const point = await fetch(`${baseUrl}/api/v1/admin/meeting-points/8`, {
      method: "DELETE",
    });
    assert.equal(point.status, 204);

    const student = await fetch(`${baseUrl}/api/v1/admin/students/42`, {
      method: "DELETE",
    });
    assert.equal(student.status, 204);

    const route = await fetch(`${baseUrl}/api/v1/admin/routes/3`, {
      method: "DELETE",
    });
    assert.equal(route.status, 204);

    const school = await fetch(`${baseUrl}/api/v1/admin/schools/2`, {
      method: "DELETE",
    });
    assert.equal(school.status, 204);
  });

  await t.test("consulta roster, estudiantes y colegios", async () => {
    const roster = await fetch(
      `${baseUrl}/api/v1/admin/meeting-points/8/students?shift=541`
    );
    assert.equal(roster.status, 200);
    const [name, meetingPointId, shift] = calls.at(-1);
    assert.equal(name, "getRosterAtMeetingPoint");
    assert.equal(meetingPointId, "8");
    assert.equal(shift, "541");

    const studentPoints = await fetch(
      `${baseUrl}/api/v1/admin/students/42/meeting-points`
    );
    assert.equal(studentPoints.status, 200);

    const schools = await fetch(`${baseUrl}/api/v1/admin/schools?zone=NORTE`);
    assert.equal(schools.status, 200);
    assert.equal(calls.at(-1)[0], "listSchools");
    assert.equal(calls.at(-1)[1], "NORTE");
  });

  await t.test("valida ids numéricos en administración", async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/schools/abc`);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "INVALID_REQUEST");
  });
});
