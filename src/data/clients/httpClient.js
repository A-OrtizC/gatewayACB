const services = require("../../config/services");

class HttpError extends Error {
  constructor(message, status, service, body) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.service = service;
    this.body = body;
  }
}

function getBaseUrl(service) {
  const baseUrl = services[service];
  if (!baseUrl) {
    throw new HttpError(
      `URL base no definida para el microservicio "${service}". Verifica src/config/services.js y tus variables de entorno.`,
      undefined,
      service
    );
  }
  return baseUrl.replace(/\/$/, "");
}

async function request(service, path, options = {}) {
  const baseUrl = getBaseUrl(service);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const controller = new AbortController();
  const timeout = options.timeout ?? 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const fetchOptions = {
      method: options.method || "GET",
      headers,
      signal: controller.signal,
      ...options,
    };

    if (options.body !== undefined && options.body !== null) {
      if (typeof options.body === "object" && !(options.body instanceof FormData)) {
        fetchOptions.body = JSON.stringify(options.body);
      } else {
        fetchOptions.body = options.body;
      }
    }

    const res = await fetch(url, fetchOptions);

    const contentType = res.headers.get("content-type") || "";
    let body = null;

    if (contentType.includes("application/json")) {
      body = await res.json().catch(() => null);
    } else {
      const text = await res.text().catch(() => null);
      body = text || null;
    }

    if (!res.ok) {
      const message =
        (body && typeof body === "object" && body.message) ||
        `Error HTTP ${res.status} al llamar a ${service}`;
      throw new HttpError(message, res.status, service, body);
    }

    return body;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new HttpError("Timeout de solicitud al microservicio", 408, service);
    }
    if (err instanceof HttpError) {
      throw err;
    }
    throw new HttpError(err.message || "Error de red al llamar al microservicio", undefined, service);
  } finally {
    clearTimeout(timeoutId);
  }
}

function get(service, path, options = {}) {
  return request(service, path, { ...options, method: "GET" });
}

function post(service, path, body, options = {}) {
  return request(service, path, { ...options, method: "POST", body });
}

function put(service, path, body, options = {}) {
  return request(service, path, { ...options, method: "PUT", body });
}

function patch(service, path, body, options = {}) {
  return request(service, path, { ...options, method: "PATCH", body });
}

function del(service, path, options = {}) {
  return request(service, path, { ...options, method: "DELETE" });
}

module.exports = {
  request,
  get,
  post,
  put,
  patch,
  delete: del,
  HttpError,
};
