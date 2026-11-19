const { buildRequestContext, sendResult } = require("../utils/requestContext");

function createPathsController(service) {
  return {
    async findAll(req, res) {
      const context = buildRequestContext(req);
      const result = await service.findAll(
        req.query,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async search(req, res) {
      const context = buildRequestContext(req);
      const result = await service.search(
        req.query,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async listMeetingPoints(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listMeetingPoints(
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async findById(req, res) {
      const context = buildRequestContext(req);
      const result = await service.findById(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getOverview(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getOverview(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getFirstMeetingPoint(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getFirstMeetingPoint(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getEndpoints(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getEndpoints(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async importKmz(req, res) {
      const context = buildRequestContext(req);
      if (req.headers["content-type"]) {
        context.headers["content-type"] = req.headers["content-type"];
      }
      const result = await service.importKmz(
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    },

    async notifyStatus(req, res) {
      const context = buildRequestContext(req);
      const result = await service.notifyStatus(
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    },

    async validateFirstMeetingPoint(req, res) {
      const context = buildRequestContext(req);
      const result = await service.validateFirstMeetingPoint(
        req.params.id,
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(200).json(result);
    },
  };
}

module.exports = createPathsController;
