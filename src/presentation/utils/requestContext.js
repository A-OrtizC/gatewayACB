function buildRequestContext(req, extraHeaders = {}) {
  const headers = {};
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }
  if (req.headers["idempotency-key"]) {
    headers["idempotency-key"] = req.headers["idempotency-key"];
  }
  headers["x-correlation-id"] = req.correlationId;
  return {
    headers: { ...headers, ...extraHeaders },
    correlationId: req.correlationId,
  };
}

function sendResult(res, result, status = 200) {
  if (result === null || result === undefined) {
    return res.status(204).end();
  }
  return res.status(status).json(result);
}

// Respuestas de GPS que necesitan conservar el status del upstream (201 nuevo,
// 200 replay o 204 sin contenido).
function sendUpstreamResult(res, result, fallbackStatus = 200) {
  if (
    result &&
    typeof result === "object" &&
    Number.isInteger(result.status) &&
    Object.prototype.hasOwnProperty.call(result, "body")
  ) {
    return sendResult(res, result.body, result.status);
  }
  return sendResult(res, result, fallbackStatus);
}

module.exports = { buildRequestContext, sendResult, sendUpstreamResult };
