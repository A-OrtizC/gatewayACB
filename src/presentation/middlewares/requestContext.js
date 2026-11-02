const { randomUUID } = require("node:crypto");

function requestContext(req, res, next) {
  const requestedId = req.get("x-correlation-id");
  req.correlationId =
    requestedId && /^[\w.-]{1,128}$/.test(requestedId) ? requestedId : randomUUID();
  res.set("x-correlation-id", req.correlationId);
  next();
}

module.exports = requestContext;
