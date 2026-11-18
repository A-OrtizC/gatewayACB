const { buildRequestContext, sendResult } = require("../utils/requestContext");

function createUsersController(service) {
  return {
    async listGuides(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listGuides(
        req.query,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getGuide(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getGuide(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async createGuide(req, res) {
      const context = buildRequestContext(req);
      const result = await service.createGuide(
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    },

    async updateGuide(req, res) {
      const context = buildRequestContext(req);
      const result = await service.updateGuide(
        req.params.id,
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async listStudents(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listStudents(
        req.query,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async listStudentsBySchool(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listStudentsBySchool(
        req.params.schoolId,
        req.query,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getStudent(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getStudent(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async createStudent(req, res) {
      const context = buildRequestContext(req);
      const result = await service.createStudent(
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    },

    async updateStudent(req, res) {
      const context = buildRequestContext(req);
      const result = await service.updateStudent(
        req.params.id,
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async assignGuardian(req, res) {
      const context = buildRequestContext(req);
      const result = await service.assignGuardian(
        req.params.id,
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
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
  };
}

module.exports = createUsersController;
