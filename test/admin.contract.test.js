const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");

process.env.AUTH_SERVICE_URL = "http://auth.test";
process.env.USERS_SERVICE_URL = "http://users.test";
process.env.OPERATIONS_SERVICE_URL = "http://operations.test";
process.env.ROUTES_SERVICE_URL = "http://routes.test";
process.env.PATHS_SERVICE_URL = "http://paths.test";
process.env.GPS_SERVICE_URL = "http://gps.test";
process.env.GPS_INTERNAL_TOKEN = "internal-token";

const { createApp } = require("../src/app");
const routesRepository = require("../src/data/repositories/routesRepository");
const operationsRepository = require("../src/data/repositories/operationsRepository");
const pathsRepository = require("../src/data/repositories/pathsRepository");
const gpsRepository = require("../src/data/repositories/gpsRepository");

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json" },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

async function withFetchStub(stub, action) {
  const original = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    return await action();
  } finally {
    globalThis.fetch = original;
  }
}

async function startApp(services = {}) {
  const calls = [];
  const fake = (name) => async (...args) => {
    calls.push([name, ...args]);
    return { ok: true };
  };
  const pathsService = services.pathsService || {
    findAll: fake("findAll"),
    search: fake("search"),
    listMeetingPoints: fake("listMeetingPoints"),
    findById: fake("findById"),
    getOverview: fake("getOverview"),
    getFirstMeetingPoint: fake("getFirstMeetingPoint"),
    getEndpoints: fake("getEndpoints"),
    importKmz: fake("importKmz"),
    validateFirstMeetingPoint: fake("validateFirstMeetingPoint"),
    notifyStatus: fake("notifyStatus"),
  };
  const routesService = services.routesService || {};
  const operationsService = services.operationsService || {};
  const gpsService = services.gpsService || {};

  const server = createApp({
    pathsService,
    authService: services.authService,
    usersService: services.usersService,
    routesService,
    routesOrchestrator: services.routesOrchestrator,
    studentsOrchestrator: services.studentsOrchestrator,
    attendanceOrchestrator: services.attendanceOrchestrator,
    operationsService,
    tripsOrchestrator: services.tripsOrchestrator,
    gpsService,
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

test("admin_routes se publica bajo /api/v1/admin y reenvía la ruta real", async (t) => {
  const calls = [];
  const record = (name, value = { name }) => async (...args) => {
    calls.push([name, ...args]);
    return typeof value === "function" ? value(...args) : value;
  };
  const harness = await startApp({
    routesService: {
      listSchools: record("listSchools"),
      createSchool: record("createSchool"),
      getSchool: record("getSchool"),
      updateSchool: record("updateSchool"),
      deactivateSchool: record("deactivateSchool"),
      listRoutes: record("listRoutes"),
      assignGuidesToRoute: record("assignGuidesToRoute"),
      listStudentsByRoute: record("listStudentsByRoute"),
      createMeetingPoint: record("createMeetingPoint"),
      deleteMeetingPoint: record("deleteMeetingPoint", null),
      getRosterAtMeetingPoint: record("getRosterAtMeetingPoint"),
      getStudent: record("getStudent"),
    },
    studentsOrchestrator: {
      getOne: record("getOne"),
    },
  });
  t.after(() => harness.close());

  const schools = await fetch(`${harness.baseUrl}/api/v1/admin/schools?zone=Norte`, {
    headers: { authorization: "Bearer jwt", "x-correlation-id": "admin-1" },
  });
  assert.equal(schools.status, 200);
  assert.equal(calls.at(-1)[0], "listSchools");
  assert.equal(calls.at(-1)[1], "Norte");
  assert.equal(calls.at(-1)[2].authorization, "Bearer jwt");
  assert.equal(calls.at(-1)[2]["x-correlation-id"], "admin-1");

  const guideAssignment = await fetch(
    `${harness.baseUrl}/api/v1/admin/routes/7/guides`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guides: [{ guideId: 3, primary: true }] }),
    }
  );
  assert.equal(guideAssignment.status, 200);
  assert.equal(calls.at(-1)[0], "assignGuidesToRoute");
  assert.equal(calls.at(-1)[1], "7");
  assert.deepEqual(calls.at(-1)[2], { guides: [{ guideId: 3, primary: true }] });

  const roster = await fetch(
    `${harness.baseUrl}/api/v1/admin/meeting-points/4/students?shift=542`
  );
  assert.equal(roster.status, 200);
  assert.equal(calls.at(-1)[0], "getRosterAtMeetingPoint");
  assert.equal(calls.at(-1)[1], "4");
  assert.equal(calls.at(-1)[2], "542");

  const routeStudent = await fetch(
    `${harness.baseUrl}/api/v1/admin/route-students/5`
  );
  assert.equal(routeStudent.status, 200);
  assert.equal(calls.at(-1)[0], "getOne");

  const removed = await fetch(`${harness.baseUrl}/api/v1/admin/meeting-points/9`, {
    method: "DELETE",
  });
  assert.equal(removed.status, 204);
  assert.equal(calls.at(-1)[0], "deleteMeetingPoint");

  const invalidId = await fetch(`${harness.baseUrl}/api/v1/admin/routes/MM04`);
  assert.equal(invalidId.status, 400);
  assert.equal((await invalidId.json()).error.code, "INVALID_REQUEST");
  assert.equal(calls.at(-1)[0], "deleteMeetingPoint");
});

test("admin_routes publica el resumen de ruta en /admin/routes/{id}/overview", async (t) => {
  const harness = await startApp({
    routesService: {},
    routesOrchestrator: {
      getOverview: async (id) => ({ route: { id }, firstMeetingPoint: null }),
    },
  });
  t.after(() => harness.close());

  const response = await fetch(`${harness.baseUrl}/api/v1/admin/routes/3/overview`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    route: { id: "3" },
    firstMeetingPoint: null,
  });
});

test("los alias administrativos reenvían a auth y admin_users", async (t) => {
  const calls = [];
  const record = (name) => async (...args) => {
    calls.push([name, ...args]);
    return { ok: true };
  };
  const harness = await startApp({
    authService: { login: record("login") },
    usersService: {
      listGuides: record("listGuides"),
      listStudents: record("listStudents"),
      search: record("search"),
    },
  });
  t.after(() => harness.close());

  const login = await fetch(`${harness.baseUrl}/api/v1/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "guia", password: "secreto" }),
  });
  assert.equal(login.status, 200);
  assert.equal(calls.at(-1)[0], "login");
  assert.deepEqual(calls.at(-1)[1], { username: "guia", password: "secreto" });

  const guides = await fetch(`${harness.baseUrl}/api/v1/admin/guides`);
  assert.equal(guides.status, 200);
  assert.equal(calls.at(-1)[0], "listGuides");

  const students = await fetch(`${harness.baseUrl}/api/v1/admin/students`);
  assert.equal(students.status, 200);
  assert.equal(calls.at(-1)[0], "listStudents");

  const search = await fetch(
    `${harness.baseUrl}/api/v1/admin/search?type=CC&number=123`
  );
  assert.equal(search.status, 200);
  assert.equal(calls.at(-1)[0], "search");
});

test("admin_operations se publica bajo /api/v1/admin y valida ids numéricos", async (t) => {
  const calls = [];
  const record = (name) => async (...args) => {
    calls.push([name, ...args]);
    return { name };
  };
  const harness = await startApp({
    operationsService: {
      createTrip: record("createTrip"),
      getTrip: record("getTrip"),
      getTripByRouteAndDate: record("getTripByRouteAndDate"),
      startTrip: record("startTrip"),
      finishTrip: record("finishTrip"),
      listTripEvents: record("listTripEvents"),
      initializeRoster: record("initializeRoster"),
      listStudentAttendance: record("listStudentAttendance"),
      registerOrUpdateAttendance: record("registerOrUpdateAttendance"),
      listGuideFaultCycles: record("listGuideFaultCycles"),
      markMinorFaultNotified: record("markMinorFaultNotified"),
      listGuideCheckIns: record("listGuideCheckIns"),
    },
  });
  t.after(() => harness.close());

  const started = await fetch(`${harness.baseUrl}/api/v1/admin/trips/9/start`, {
    method: "POST",
  });
  assert.equal(started.status, 200);
  assert.equal(calls.at(-1)[0], "startTrip");
  assert.equal(calls.at(-1)[1], "9");

  const attendance = await fetch(
    `${harness.baseUrl}/api/v1/admin/trips/9/attendance/42`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ present: true }),
    }
  );
  assert.equal(attendance.status, 200);
  assert.equal(calls.at(-1)[0], "registerOrUpdateAttendance");
  assert.equal(calls.at(-1)[1], "9");
  assert.equal(calls.at(-1)[2], "42");
  assert.deepEqual(calls.at(-1)[3], { present: true });

  const roster = await fetch(
    `${harness.baseUrl}/api/v1/admin/trips/9/attendance/roster`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify([{ studentId: 1 }, { studentId: 2 }]),
    }
  );
  assert.equal(roster.status, 201);
  assert.equal(calls.at(-1)[0], "initializeRoster");

  const byRoute = await fetch(
    `${harness.baseUrl}/api/v1/admin/trips/by-route/5?date=2026-11-17`
  );
  assert.equal(byRoute.status, 200);
  assert.equal(calls.at(-1)[0], "getTripByRouteAndDate");
  assert.equal(calls.at(-1)[1], "5");
  assert.equal(calls.at(-1)[2], "2026-11-17");

  const checkIns = await fetch(
    `${harness.baseUrl}/api/v1/admin/trip-guides/3/check-ins`
  );
  assert.equal(checkIns.status, 200);
  assert.equal(calls.at(-1)[0], "listGuideCheckIns");

  const invalid = await fetch(`${harness.baseUrl}/api/v1/admin/trips/abc/start`, {
    method: "POST",
  });
  assert.equal(invalid.status, 400);
});

test("el tracking GPS se enruta solo al componente Go", async (t) => {
  const calls = [];
  const gpsService = {
    createTrackingSession: async (...args) => {
      calls.push(["createTrackingSession", ...args]);
      return { status: 201, body: { tracking_id: "t-1" } };
    },
    getTrackingSession: async (...args) => {
      calls.push(["getTrackingSession", ...args]);
      return { tracking_id: "t-1" };
    },
    registerObservation: async (...args) => {
      calls.push(["registerObservation", ...args]);
      return { status: 201, body: { ok: true } };
    },
    listTrackingSessionPositions: async (...args) => {
      calls.push(["listTrackingSessionPositions", ...args]);
      return [{ sequence: 1 }];
    },
    getLatestPosition: async (...args) => {
      calls.push(["getLatestPosition", ...args]);
      return { sequence: 1 };
    },
    getTrackingSessionControl: async (...args) => {
      calls.push(["getTrackingSessionControl", ...args]);
      return { state: "active" };
    },
    finishTrackingSession: async (...args) => {
      calls.push(["finishTrackingSession", ...args]);
      return { state: "finished" };
    },
    disableTrackingSession: async (...args) => {
      calls.push(["disableTrackingSession", ...args]);
      return { state: "disabled" };
    },
  };
  const harness = await startApp({ gpsService });
  t.after(() => harness.close());

  const created = await fetch(`${harness.baseUrl}/api/v1/tracking-sessions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "idem-1",
    },
    body: JSON.stringify({ guide_id: "g-1", route_id: "r-1" }),
  });
  assert.equal(created.status, 201);
  assert.equal(calls.at(-1)[0], "createTrackingSession");
  assert.deepEqual(calls.at(-1)[1], { guide_id: "g-1", route_id: "r-1" });
  assert.equal(calls.at(-1)[2], "idem-1");

  const latest = await fetch(
    `${harness.baseUrl}/api/v1/tracking-sessions/t-1/latest-position`
  );
  assert.equal(latest.status, 200);
  assert.equal(calls.at(-1)[0], "getLatestPosition");

  const disabled = await fetch(
    `${harness.baseUrl}/api/v1/tracking-sessions/t-1/disable`,
    { method: "PATCH" }
  );
  assert.equal(disabled.status, 200);
  assert.equal(calls.at(-1)[0], "disableTrackingSession");

  // pathsService no debe recibir ninguna llamada de tracking.
  assert.equal(harness.calls.some(([name]) => name.startsWith("find")), false);
});

test("paths expone los alias de import, status y validación de PE01", async (t) => {
  const calls = [];
  const record = (name) => async (...args) => {
    calls.push([name, ...args]);
    return { ok: true };
  };
  const harness = await startApp({
    pathsService: {
      importKmz: record("importKmz"),
      notifyStatus: record("notifyStatus"),
      validateFirstMeetingPoint: record("validateFirstMeetingPoint"),
    },
  });
  t.after(() => harness.close());

  const form = new FormData();
  form.append(
    "file",
    new Blob(["kmz"], { type: "application/vnd.google-earth.kmz" }),
    "route.kmz"
  );
  const imported = await fetch(`${harness.baseUrl}/api/v1/imports/kmz`, {
    method: "POST",
    body: form,
  });
  assert.equal(imported.status, 201);
  assert.equal(calls.at(-1)[0], "importKmz");

  const notified = await fetch(`${harness.baseUrl}/api/v1/status/notify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "PE01" }),
  });
  assert.equal(notified.status, 201);
  assert.equal(calls.at(-1)[0], "notifyStatus");

  const validated = await fetch(
    `${harness.baseUrl}/api/v1/routes/64b7f0c2e1a2b3c4d5e6f7a8/first-meeting-point/validate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ latitude: 4.6, longitude: -74.1 }),
    }
  );
  assert.equal(validated.status, 200);
  assert.equal(calls.at(-1)[0], "validateFirstMeetingPoint");
  assert.equal(calls.at(-1)[1], "64b7f0c2e1a2b3c4d5e6f7a8");
});

test("los endpoints sin contrato backend responden 501 explícito", async (t) => {
  const harness = await startApp();
  t.after(() => harness.close());

  for (const [method, path] of [
    ["GET", "/api/v1/admin/zones"],
    ["GET", "/api/v1/admin/leaders"],
    ["GET", "/api/v1/admin/arrivals"],
    ["POST", "/api/v1/admin/routes/MM04/submit"],
    ["DELETE", "/api/v1/admin/students/5"],
    ["GET", "/api/v1/status"],
    ["GET", "/api/v1/positions/latest"],
  ]) {
    const response = await fetch(`${harness.baseUrl}${path}`, { method });
    assert.equal(response.status, 501, `${method} ${path}`);
    const body = await response.json();
    assert.equal(body.error.code, "FEATURE_UNAVAILABLE");
    assert.ok(body.error.correlationId);
  }
});

test("los repositorios administrativos usan la firma real del cliente HTTP", async () => {
  const requests = [];
  const stub = async (url, options) => {
    requests.push([String(url), options]);
    return jsonResponse({ ok: true });
  };

  await withFetchStub(stub, async () => {
    await routesRepository.listRoutes(2, "Norte", {
      authorization: "Bearer x",
    });
    await routesRepository.getRosterAtMeetingPoint(4, "542");
    await operationsRepository.markMinorFaultNotified(8);
    await pathsRepository.validateFirstMeetingPoint("route-1", { latitude: 4 });
    await gpsRepository.findTrackingSessionLatestPosition("tracking-1");
  });

  const [routesUrl, routesOptions] = requests[0];
  assert.equal(routesUrl, "http://routes.test/api/v1/routes?schoolId=2&zone=Norte");
  assert.equal(routesOptions.method, "GET");
  assert.equal(routesOptions.headers.authorization, "Bearer x");

  assert.equal(
    requests[1][0],
    "http://routes.test/api/v1/meeting-points/4/students?shift=542"
  );

  const [faultUrl, faultOptions] = requests[2];
  assert.equal(
    faultUrl,
    "http://operations.test/api/v1/guide-faults/minor/8/notified"
  );
  assert.equal(faultOptions.method, "PUT");
  assert.equal(faultOptions.body, undefined);

  assert.equal(
    requests[3][0],
    "http://paths.test/api/v1/routes/route-1/first-meeting-point/validate"
  );
  assert.equal(requests[3][1].method, "POST");

  const [positionUrl, positionOptions] = requests[4];
  assert.equal(
    positionUrl,
    "http://gps.test/api/v1/tracking-sessions/tracking-1/latest-position"
  );
  assert.equal(positionOptions.headers.Authorization, "Bearer internal-token");
});
