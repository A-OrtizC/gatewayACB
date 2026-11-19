function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const safeError = error && typeof error === "object" ? error : new Error(String(error));
  const status = getHttpStatus(safeError);
  const isClientError = status < 500;
  const body = {
    error: {
      code:
        safeError.upstreamCode ||
        safeError.code ||
        (isClientError ? "INVALID_REQUEST" : "INTERNAL_ERROR"),
      message: isClientError ? safeError.message : "Ocurrió un error interno en el Gateway.",
      correlationId: req.correlationId
    }
  };

  if (safeError.service) {
    body.error.service = safeError.service;
  }
  if (safeError.details) {
    body.error.details = safeError.details;
  }

  if (status >= 500) {
    console.error(
      `[gateway] ${req.correlationId} ${safeError.name || "Error"}: ${safeError.message}`
    );
  }

  if (safeError.upstreamHeaders) {
    for (const [name, value] of Object.entries(safeError.upstreamHeaders)) {
      if (value) {
        res.set(name, value);
      }
    }
  }

  return res.status(status).json(body);
}

function getHttpStatus(error) {
  if (error.type === "TIMEOUT") {
    return 504;
  }
  if (error.type === "NETWORK") {
    return 502;
  }
  if (error.type === "UPSTREAM") {
    return Number.isInteger(error.status) && error.status >= 500 && error.status < 600
      ? error.status
      : 502;
  }
  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 600) {
    return error.status;
  }
  return 500;
}

module.exports = errorHandler;
