const { getRequestContext, sendResult } = require("./controllerContext");

function createGpsController(service) {
  return {
    async getSession(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getSession(
        req.params.trackingId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async createObservation(req, res) {
      // La observacion conserva el Bearer de la sesion; no usa el token interno.
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.createObservation(
        req.params.trackingId,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result, 201);
    },

    async listPositions(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listPositions(
        req.params.trackingId,
        req.query,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async createSession(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.createSession(
        req.body,
        req.get("Idempotency-Key"),
        headers,
        correlationId
      );
      sendResult(res, result, 201);
    },

    async getControl(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getControl(
        req.params.trackingId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async getLatestPosition(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getLatestPosition(
        req.params.trackingId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async finishSession(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.finishSession(
        req.params.trackingId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async disableSession(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.disableSession(
        req.params.trackingId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },
  };
}

module.exports = createGpsController;
