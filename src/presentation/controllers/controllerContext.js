function getRequestContext(req) {
  const headers = {};
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }
  headers["x-correlation-id"] = req.correlationId;
  return { headers, correlationId: req.correlationId };
}

function sendResult(res, result, status = 200) {
  if (result === null || result === undefined) {
    return res.status(204).end();
  }
  return res.status(status).json(result);
}

module.exports = { getRequestContext, sendResult };
