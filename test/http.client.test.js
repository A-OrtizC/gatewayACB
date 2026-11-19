const assert = require("node:assert/strict");
const test = require("node:test");

process.env.PATHS_SERVICE_URL = "http://paths.test";
process.env.GPS_SERVICE_URL = "http://gps.test";

const httpClient = require("../src/data/clients/httpClient");

function stubFetch(response) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    const headers = response.headers || {};
    return {
      ok: response.ok !== false,
      status: response.status || 200,
      headers: {
        get: (name) => {
          const key = Object.keys(headers).find(
            (candidate) => candidate.toLowerCase() === name.toLowerCase()
          );
          return key ? headers[key] : null;
        },
      },
      json: async () => response.body,
      text: async () =>
        typeof response.body === "string" ? response.body : "",
    };
  };
  return {
    calls,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

test("httpClient conserva status y headers con fullResponse", async (t) => {
  const stub = stubFetch({
    status: 201,
    headers: { "Content-Type": "application/json" },
    body: { tracking_id: "abc" },
  });
  t.after(stub.restore);

  const result = await httpClient.post(
    "gps",
    "/api/v1/tracking-sessions",
    { trip_id: "1" },
    { fullResponse: true }
  );

  assert.equal(result.status, 201);
  assert.deepEqual(result.body, { tracking_id: "abc" });
  assert.equal(result.headers.get("content-type"), "application/json");
  assert.equal(stub.calls[0].options.method, "POST");
});

test("httpClient mapea errores del GPS y conserva headers del upstream", async (t) => {
  const stub = stubFetch({
    ok: false,
    status: 503,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": "1",
    },
    body: { error: "temporarily_unavailable" },
  });
  t.after(stub.restore);

  await assert.rejects(
    () => httpClient.get("gps", "/api/v1/tracking-sessions/abc/control"),
    (error) => {
      assert.equal(error.name, "HttpError");
      assert.equal(error.status, 503);
      assert.equal(error.upstreamCode, "temporarily_unavailable");
      assert.deepEqual(error.upstreamHeaders, { "Retry-After": "1" });
      return true;
    }
  );
});

test("httpClient conserva WWW-Authenticate en 401 del GPS", async (t) => {
  const stub = stubFetch({
    ok: false,
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": "Bearer",
    },
    body: { error: "unauthorized" },
  });
  t.after(stub.restore);

  await assert.rejects(
    () =>
      httpClient.post(
        "gps",
        "/api/v1/tracking-sessions/abc/observations",
        { sequence: 1 },
        { headers: { authorization: "Bearer expired" } }
      ),
    (error) => {
      assert.equal(error.status, 401);
      assert.equal(error.upstreamCode, "unauthorized");
      assert.deepEqual(error.upstreamHeaders, {
        "WWW-Authenticate": "Bearer",
      });
      return true;
    }
  );
});

test("httpClient no interpreta errores snake_case de otros servicios", async (t) => {
  const stub = stubFetch({
    ok: false,
    status: 503,
    headers: { "Content-Type": "application/json" },
    body: { error: "temporarily_unavailable" },
  });
  t.after(stub.restore);

  await assert.rejects(
    () => httpClient.get("paths", "/api/v1/status"),
    (error) => {
      assert.equal(error.upstreamCode, null);
      return true;
    }
  );
});

test("httpClient elimina opciones internas antes de fetch", async (t) => {
  const stub = stubFetch({
    headers: { "Content-Type": "application/json" },
    body: { ok: true },
  });
  t.after(stub.restore);

  await httpClient.get("paths", "/api/v1/routes", {
    query: { status: "active" },
    timeout: 500,
    fullResponse: false,
  });

  const url = new URL(stub.calls[0].url);
  assert.equal(url.searchParams.get("status"), "active");
  assert.equal("query" in stub.calls[0].options, false);
  assert.equal("timeout" in stub.calls[0].options, false);
  assert.equal("fullResponse" in stub.calls[0].options, false);
});

test("httpClient devuelve null para respuestas 204", async (t) => {
  const stub = stubFetch({
    status: 204,
    headers: {},
    body: "",
  });
  t.after(stub.restore);

  const body = await httpClient.get(
    "gps",
    "/api/v1/tracking-sessions/abc/latest-position"
  );
  assert.equal(body, null);
});
