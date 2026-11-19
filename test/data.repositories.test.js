const assert = require("node:assert/strict");
const test = require("node:test");

process.env.ROUTES_SERVICE_URL = "http://routes.test";
process.env.OPERATIONS_SERVICE_URL = "http://operations.test";

const routesRepository = require("../src/data/repositories/routesRepository");
const operationsRepository = require("../src/data/repositories/operationsRepository");

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

test("routesRepository reenvía rutas administrativas con query", async (t) => {
  const stub = stubFetch();
  t.after(stub.restore);

  await routesRepository.listRoutes(2, "NORTE", {
    authorization: "Bearer token",
    "x-correlation-id": "c-1",
  });

  const call = stub.calls.at(-1);
  const url = new URL(call.url);
  assert.equal(call.options.method, "GET");
  assert.equal(url.pathname, "/api/v1/routes");
  assert.equal(url.searchParams.get("schoolId"), "2");
  assert.equal(url.searchParams.get("zone"), "NORTE");
  assert.equal(call.options.headers.authorization, "Bearer token");
});

test("routesRepository crea rutas enviando el cuerpo serializado", async (t) => {
  const stub = stubFetch();
  t.after(stub.restore);

  const payload = { routeCode: "541", schoolId: 2 };
  await routesRepository.createRoute(payload, { "x-correlation-id": "c-2" });

  const call = stub.calls.at(-1);
  assert.equal(call.options.method, "POST");
  assert.equal(call.url, "http://routes.test/api/v1/routes");
  assert.deepEqual(JSON.parse(call.options.body), payload);
  assert.equal(call.options.headers["x-correlation-id"], "c-2");
});

test("routesRepository elimina puntos de encuentro por su propio id", async (t) => {
  const stub = stubFetch();
  t.after(stub.restore);

  await routesRepository.deleteMettingPointById("9");

  const call = stub.calls.at(-1);
  assert.equal(call.options.method, "DELETE");
  assert.equal(call.url, "http://routes.test/api/v1/meeting-points/9");
});

test("routesRepository consulta el roster con la jornada", async (t) => {
  const stub = stubFetch();
  t.after(stub.restore);

  await routesRepository.getRosterAtMeetingPoint("8", "541", {
    "x-correlation-id": "c-3",
  });

  const call = stub.calls.at(-1);
  const url = new URL(call.url);
  assert.equal(url.pathname, "/api/v1/meeting-points/8/students");
  assert.equal(url.searchParams.get("shift"), "541");
  assert.equal(call.options.headers["x-correlation-id"], "c-3");
});

test("operationsRepository marca faltas con PUT sin cuerpo", async (t) => {
  const stub = stubFetch();
  t.after(stub.restore);

  await operationsRepository.markMinorFaultNotified("10", {
    "x-correlation-id": "c-4",
  });
  let call = stub.calls.at(-1);
  assert.equal(call.options.method, "PUT");
  assert.equal(
    call.url,
    "http://operations.test/api/v1/guide-faults/minor/10/notified"
  );
  assert.equal(call.options.body, undefined);

  await operationsRepository.markMajorFaultMinuted("9");
  call = stub.calls.at(-1);
  assert.equal(call.options.method, "PUT");
  assert.equal(
    call.url,
    "http://operations.test/api/v1/guide-faults/major/9/minuted"
  );
  assert.equal(call.options.body, undefined);
});

test("operationsRepository finaliza viajes sin cuerpo", async (t) => {
  const stub = stubFetch();
  t.after(stub.restore);

  await operationsRepository.finishTrip("12", undefined, {
    authorization: "Bearer token",
  });

  const call = stub.calls.at(-1);
  assert.equal(call.options.method, "POST");
  assert.equal(call.url, "http://operations.test/api/v1/trips/12/finish");
  assert.equal(call.options.body, undefined);
});

test("operationsRepository conserva el endpoint interno de check-in", async (t) => {
  const stub = stubFetch();
  t.after(stub.restore);

  await operationsRepository.recordGeolocationResult(
    "7",
    { accepted: true },
    { "x-correlation-id": "c-5" }
  );

  const call = stub.calls.at(-1);
  assert.equal(call.options.method, "POST");
  assert.equal(
    call.url,
    "http://operations.test/api/v1/internal/trip-guides/7/check-ins"
  );
  assert.deepEqual(JSON.parse(call.options.body), { accepted: true });
});

test("operationsRepository inicializa el roster con un arreglo", async (t) => {
  const stub = stubFetch();
  t.after(stub.restore);

  const roster = [{ studentId: 42, studentName: "Juan" }];
  await operationsRepository.initializeRoster("12", roster, {
    "x-correlation-id": "c-6",
  });

  const call = stub.calls.at(-1);
  assert.equal(
    call.url,
    "http://operations.test/api/v1/trips/12/attendance/roster"
  );
  assert.deepEqual(JSON.parse(call.options.body), roster);
});
