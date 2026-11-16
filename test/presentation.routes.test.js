const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");

process.env.PATHS_SERVICE_URL = "http://paths.test";
const appModule = require("../src/app");
const app = appModule.createApp;
const CommunicationError = require("../src/logic/errors/CommunicationError");
const createPathsService = require("../src/logic/services/paths.service");
const httpClient = require("../src/data/clients/httpClient");

test("API HTTP de rutas", async (t) => {
  const calls = [];
  const pathsService = {
    findAll: async (...args) => {
      calls.push(["findAll", ...args]);
      return { items: [{ id: "route-1" }], total: 1 };
    },
    search: async (...args) => {
      calls.push(["search", ...args]);
      return { items: [{ id: "route-1" }], total: 1 };
    },
    findById: async (...args) => {
      calls.push(["findById", ...args]);
      return { id: args[0], name: "Ruta" };
    },
    getOverview: async (...args) => {
      calls.push(["getOverview", ...args]);
      return {
        route: { id: args[0] },
        firstMeetingPoint: { name: "Inicio" },
        endpoints: [{ name: "Fin" }]
      };
    },
    getFirstMeetingPoint: async (...args) => {
      calls.push(["getFirstMeetingPoint", ...args]);
      return { name: "Inicio" };
    },
    getEndpoints: async (...args) => {
      calls.push(["getEndpoints", ...args]);
      return [{ name: "Fin" }];
    },
    importKmz: async (...args) => {
      calls.push(["importKmz", ...args]);
      return { id: "import-1" };
    }
  };
  const server = app({ pathsService }).listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  await t.test("health y listado reenviado", async () => {
    const health = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { "x-correlation-id": "health-test" }
    });
    assert.equal(health.status, 200);
    assert.equal(health.headers.get("x-correlation-id"), "health-test");

    const response = await fetch(`${baseUrl}/api/v1/routes?status=active&tag=a&tag=b`, {
      headers: {
        authorization: "Bearer token",
        "x-correlation-id": "list-test"
      }
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { items: [{ id: "route-1" }], total: 1 });
    assert.equal(calls.at(-1)[0], "findAll");
    assert.deepEqual({ ...calls.at(-1)[1] }, { status: "active", tag: ["a", "b"] });
    assert.equal(calls.at(-1)[2].authorization, "Bearer token");
    assert.equal(calls.at(-1)[2]["x-correlation-id"], "list-test");
    assert.equal(calls.at(-1)[3], "list-test");

    if (process.env.NODE_ENV !== "production") {
      const docs = await fetch(`${baseUrl}/openapi.json`);
      assert.equal(docs.status, 200);
      const document = await docs.json();
      assert.ok(document.paths["/routes/{id}/overview"]);
      assert.ok(document.paths["/auth/login"]);
      assert.ok(document.paths["/guides"]);
      assert.ok(document.paths["/students"]);
      assert.ok(document.paths["/search"]);
    }
  });

  await t.test("búsqueda, detalle y orquestación", async () => {
    const search = await fetch(`${baseUrl}/api/v1/routes/search?name=Centro`);
    assert.equal(search.status, 200);
    assert.equal(calls.at(-1)[0], "search");

    const detail = await fetch(`${baseUrl}/api/v1/routes/route-1`);
    assert.equal(detail.status, 200);
    assert.deepEqual(await detail.json(), { id: "route-1", name: "Ruta" });

    const overview = await fetch(`${baseUrl}/api/v1/routes/route-1/overview`);
    assert.equal(overview.status, 200);
    assert.deepEqual(await overview.json(), {
      route: { id: "route-1" },
      firstMeetingPoint: { name: "Inicio" },
      endpoints: [{ name: "Fin" }]
    });
  });

  await t.test("puntos e importación", async () => {
    const meetingPoint = await fetch(`${baseUrl}/api/v1/routes/route-1/first-meeting-point`);
    assert.equal(meetingPoint.status, 200);
    assert.deepEqual(await meetingPoint.json(), { name: "Inicio" });

    const endpoints = await fetch(`${baseUrl}/api/v1/routes/route-1/endpoints`);
    assert.equal(endpoints.status, 200);
    assert.deepEqual(await endpoints.json(), [{ name: "Fin" }]);

    const imported = await fetch(`${baseUrl}/api/v1/routes/imports/kmz`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fileName: "route.kmz" })
    });
    assert.equal(imported.status, 201);
    assert.deepEqual(await imported.json(), { id: "import-1" });
    assert.deepEqual(calls.at(-1)[1], { fileName: "route.kmz" });
  });

  await t.test("validación y endpoint inexistente", async () => {
    const invalidQuery = await fetch(`${baseUrl}/api/v1/routes?term=${"x".repeat(501)}`);
    assert.equal(invalidQuery.status, 400);
    assert.equal((await invalidQuery.json()).error.code, "INVALID_REQUEST");

    const invalidBody = await fetch(`${baseUrl}/api/v1/routes/imports/kmz`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "[]"
    });
    assert.equal(invalidBody.status, 400);

    const missing = await fetch(`${baseUrl}/api/v1/unknown`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, "ENDPOINT_NOT_FOUND");
  });

  await t.test("errores de comunicación se normalizan", async () => {
    const failingApp = app({
      pathsService: {
        findAll: async () => {
          throw new CommunicationError({
            type: "NETWORK",
            code: "MS_PATHS_NETWORK",
            message: "Fallo privado",
            service: "paths"
          });
        }
      }
    });
    const failingServer = failingApp.listen(0);
    await once(failingServer, "listening");
    const response = await fetch(
      `http://127.0.0.1:${failingServer.address().port}/api/v1/routes`
    );
    await new Promise((resolve, reject) => {
      failingServer.close((error) => error ? reject(error) : resolve());
    });

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: {
        code: "MS_PATHS_NETWORK",
        message: "Ocurrió un error interno en el Gateway.",
        correlationId: response.headers.get("x-correlation-id"),
        service: "paths"
      }
    });
  });
});

test("OpenAPI publica todos los endpoints del gateway", async () => {
  const openapi = require("../src/config/openapi");
  const expectedOperations = {
    "/health": ["get"],
    "/auth/login": ["post"],
    "/guides": ["get", "post"],
    "/guides/{id}": ["get", "put"],
    "/students": ["get", "post"],
    "/students/school/{schoolId}": ["get"],
    "/students/{id}/guardians": ["post"],
    "/students/{id}": ["get", "put"],
    "/search": ["get"],
    "/routes": ["get"],
    "/routes/search": ["get"],
    "/routes/{id}": ["get"],
    "/routes/{id}/overview": ["get"],
    "/routes/{id}/first-meeting-point": ["get"],
    "/routes/{id}/endpoints": ["get"],
    "/routes/imports/kmz": ["post"]
  };

  for (const [path, methods] of Object.entries(expectedOperations)) {
    assert.ok(openapi.paths[path], `Falta la ruta ${path} en el OpenAPI`);
    for (const method of methods) {
      assert.ok(
        openapi.paths[path][method],
        `Falta la operación ${method.toUpperCase()} ${path} en el OpenAPI`
      );
    }
  }

  assert.ok(openapi.components.securitySchemes.bearerAuth);
  assert.deepEqual(openapi.paths["/auth/login"].post.security, []);
  assert.deepEqual(openapi.paths["/guides"].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(openapi.paths["/students"].post.security, [
    { bearerAuth: [] }
  ]);
  assert.deepEqual(openapi.paths["/search"].get.security, [{ bearerAuth: [] }]);
  assert.ok(openapi.components.responses.UpstreamError);
  assert.ok(openapi.components.responses.UpstreamTimeout);

  const routeListSchema =
    openapi.paths["/routes"].get.responses[200].content["application/json"]
      .schema;
  assert.equal(routeListSchema.type, "array");
  assert.deepEqual(
    routeListSchema.items,
    { $ref: "#/components/schemas/GeoRoute" }
  );

  const routeSearchParams = openapi.paths["/routes/search"].get.parameters.map(
    (parameter) => parameter.$ref.split("/").pop()
  );
  assert.deepEqual(routeSearchParams, [
    "CorrelationId",
    "RouteCode",
    "RouteCodeAlternative"
  ]);
});

test("todas las referencias del OpenAPI resuelven", async () => {
  const openapi = require("../src/config/openapi");

  function collectRefs(value, refs = []) {
    if (Array.isArray(value)) {
      value.forEach((item) => collectRefs(item, refs));
      return refs;
    }
    if (value && typeof value === "object") {
      if (typeof value.$ref === "string") {
        refs.push(value.$ref);
      }
      Object.values(value).forEach((item) => collectRefs(item, refs));
    }
    return refs;
  }

  const refs = collectRefs(openapi);
  assert.ok(refs.length > 0);

  for (const ref of refs) {
    assert.ok(ref.startsWith("#/"), `Referencia externa no permitida: ${ref}`);
    const resolved = ref
      .slice(2)
      .split("/")
      .reduce((node, key) => (node ? node[key] : undefined), openapi);
    assert.ok(resolved, `Referencia no resuelta: ${ref}`);
  }
});

test("caso de uso agrega los datos de ruta usando el repositorio", async () => {
  const called = [];
  const service = createPathsService({
    findById: async () => {
      called.push("route");
      return { id: "route-1" };
    },
    findFirstMettingPoint: async () => {
      called.push("meeting");
      return { name: "Inicio" };
    },
    findEndPoints: async () => {
      called.push("endpoints");
      return [{ name: "Fin" }];
    }
  });

  assert.deepEqual(await service.getOverview("route-1", {}, "test-id"), {
    route: { id: "route-1" },
    firstMeetingPoint: { name: "Inicio" },
    endpoints: [{ name: "Fin" }]
  });
  assert.deepEqual(called, ["route", "meeting", "endpoints"]);
});

test("cliente HTTP serializa filtros y elimina opciones internas de fetch", async () => {
  const originalFetch = globalThis.fetch;
  let fetchArguments;
  globalThis.fetch = async (...args) => {
    fetchArguments = args;
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ items: [] })
    };
  };

  try {
    await httpClient.get("paths", "/routes/search", {
      query: { name: "Ruta 1", tag: ["uno", "dos"] },
      timeout: 1000
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  const url = new URL(String(fetchArguments[0]));
  assert.equal(url.searchParams.get("name"), "Ruta 1");
  assert.deepEqual(url.searchParams.getAll("tag"), ["uno", "dos"]);
  assert.equal("query" in fetchArguments[1], false);
  assert.equal("timeout" in fetchArguments[1], false);
});
