const CommunicationError = require("./CommunicationError");

function extractMessage(body, fallback) {
  if (!body) return fallback;
  if (typeof body === "string") return body;
  if (typeof body === "object") {
    if (typeof body.message === "string") return body.message;
    if (body.error) {
      if (typeof body.error === "string") return body.error;
      if (typeof body.error.message === "string") return body.error.message;
    }
    if (typeof body.title === "string") return body.title;
  }
  return fallback;
}

function extractDetails(body) {
  if (!body || typeof body !== "object") return null;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.errors)) return body.errors;
  if (body.error && typeof body.error === "object" && Array.isArray(body.error.details)) {
    return body.error.details;
  }
  if (Array.isArray(body.errorDetails)) return body.errorDetails;
  return null;
}

function normalizeMsError(err, options = {}) {
  const correlationId = options.correlationId || null;

  if (!err) {
    return new CommunicationError({
      type: "UNKNOWN",
      code: "UNKNOWN",
      message: "Error desconocido",
      service: null,
      status: null,
      details: null,
      durationMs: null,
      correlationId,
      raw: err,
    });
  }

  if (err.name === "OrchestratorTimeoutError" || err.code === "ORCHESTRATOR_TIMEOUT") {
    return new CommunicationError({
      type: "TIMEOUT",
      code: "GW_ORCHESTRATOR_TIMEOUT",
      message: err.message || "Timeout total del caso de uso",
      service: null,
      status: 504,
      details: null,
      durationMs: err.timeoutMs || null,
      correlationId,
      raw: err,
    });
  }

  if (err.name === "HttpError") {
    const service = err.service || null;
    const status = err.status || null;
    const body = err.body;
    const durationMs = err.durationMs || null;

    if (err.code === "TIMEOUT") {
      return new CommunicationError({
        type: "TIMEOUT",
        code: service ? `MS_${service.toUpperCase()}_TIMEOUT` : "TIMEOUT",
        message: extractMessage(body, err.message || "Timeout de solicitud al microservicio"),
        service,
        status: 408,
        details: extractDetails(body),
        durationMs,
        correlationId,
        raw: body,
      });
    }

    if (err.code === "NETWORK_ERROR") {
      return new CommunicationError({
        type: "NETWORK",
        code: service ? `MS_${service.toUpperCase()}_NETWORK` : "NETWORK_ERROR",
        message: extractMessage(body, err.message || "Error de red al llamar al microservicio"),
        service,
        status: null,
        details: extractDetails(body),
        durationMs,
        correlationId,
        raw: body,
      });
    }

    if (err.code === "SERVICE_NOT_CONFIGURED") {
      return new CommunicationError({
        type: "GATEWAY_ERROR",
        code: "GW_SERVICE_NOT_CONFIGURED",
        message: err.message || "Servicio no configurado",
        service,
        status: 500,
        details: extractDetails(body),
        durationMs,
        correlationId,
        raw: body,
      });
    }

    if (status === 400 || status === 422) {
      return new CommunicationError({
        type: "VALIDATION",
        code: service ? `MS_${service.toUpperCase()}_${status}` : `MS_ERROR_${status}`,
        message: extractMessage(body, err.message || "Error de validación"),
        service,
        status,
        details: extractDetails(body),
        durationMs,
        correlationId,
        raw: body,
      });
    }

    if (status === 401) {
      return new CommunicationError({
        type: "UNAUTHORIZED",
        code: service ? `MS_${service.toUpperCase()}_401` : "MS_ERROR_401",
        message: extractMessage(body, err.message || "No autorizado"),
        service,
        status,
        details: extractDetails(body),
        durationMs,
        correlationId,
        raw: body,
      });
    }

    if (status === 403) {
      return new CommunicationError({
        type: "FORBIDDEN",
        code: service ? `MS_${service.toUpperCase()}_403` : "MS_ERROR_403",
        message: extractMessage(body, err.message || "Prohibido"),
        service,
        status,
        details: extractDetails(body),
        durationMs,
        correlationId,
        raw: body,
      });
    }

    if (status === 404) {
      return new CommunicationError({
        type: "NOT_FOUND",
        code: service ? `MS_${service.toUpperCase()}_404` : "MS_ERROR_404",
        message: extractMessage(body, err.message || "Recurso no encontrado"),
        service,
        status,
        details: extractDetails(body),
        durationMs,
        correlationId,
        raw: body,
      });
    }

    if (status === 409) {
      return new CommunicationError({
        type: "CONFLICT",
        code: service ? `MS_${service.toUpperCase()}_409` : "MS_ERROR_409",
        message: extractMessage(body, err.message || "Conflicto"),
        service,
        status,
        details: extractDetails(body),
        durationMs,
        correlationId,
        raw: body,
      });
    }

    if (status >= 400 && status < 500) {
      return new CommunicationError({
        type: "BAD_REQUEST",
        code: service ? `MS_${service.toUpperCase()}_${status}` : `MS_ERROR_${status}`,
        message: extractMessage(body, err.message || "Solicitud inválida"),
        service,
        status,
        details: extractDetails(body),
        durationMs,
        correlationId,
        raw: body,
      });
    }

    if (status >= 500) {
      return new CommunicationError({
        type: "UPSTREAM",
        code: service ? `MS_${service.toUpperCase()}_${status}` : `MS_ERROR_${status}`,
        message: extractMessage(body, err.message || "Error del microservicio"),
        service,
        status,
        details: extractDetails(body),
        durationMs,
        correlationId,
        raw: body,
      });
    }

    return new CommunicationError({
      type: "UNKNOWN",
      code: service ? `MS_${service.toUpperCase()}_UNKNOWN` : "MS_ERROR_UNKNOWN",
      message: extractMessage(body, err.message || "Error de comunicación con microservicio"),
      service,
      status: null,
      details: extractDetails(body),
      durationMs,
      correlationId,
      raw: body,
    });
  }

  return new CommunicationError({
    type: "UNKNOWN",
    code: "UNKNOWN",
    message: err.message || "Error desconocido",
    service: null,
    status: null,
    details: null,
    durationMs: err.durationMs || null,
    correlationId,
    raw: err,
  });
}

module.exports = { normalizeMsError, extractMessage, extractDetails };
