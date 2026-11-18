const { buildRequestContext, sendResult } = require("../utils/requestContext");

function createRoutesController(service, orchestrator) {
  return {
    // Routes
    async listRoutes(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listRoutes(
        req.query.schoolId,
        req.query.zone,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getRoute(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getRoute(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async createRoute(req, res) {
      const context = buildRequestContext(req);
      const result = await service.createRoute(
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    },

    async updateRoute(req, res) {
      const context = buildRequestContext(req);
      const result = await service.updateRoute(
        req.params.id,
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async deactivateRoute(req, res) {
      const context = buildRequestContext(req);
      const result = await service.deactivateRoute(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async assignGuidesToRoute(req, res) {
      const context = buildRequestContext(req);
      const result = await service.assignGuidesToRoute(
        req.params.id,
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getRouteOverview(req, res) {
      const context = buildRequestContext(req);
      const result = await orchestrator.getOverview(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    // Meeting points
    async listMeetingPointsForRoute(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listMeetingPointsForRoute(
        req.params.routeId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async createMeetingPoint(req, res) {
      const context = buildRequestContext(req);
      const result = await service.createMeetingPoint(
        req.params.routeId,
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    },

    async getMeetingPoint(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getMeetingPoint(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async updateMeetingPoint(req, res) {
      const context = buildRequestContext(req);
      const result = await service.updateMeetingPoint(
        req.params.id,
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async deleteMeetingPoint(req, res) {
      const context = buildRequestContext(req);
      const result = await service.deleteMeetingPoint(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getRosterAtMeetingPoint(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getRosterAtMeetingPoint(
        req.params.id,
        req.query.shift,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    // Students
    async listStudentsByRoute(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listStudentsByRoute(
        req.params.routeId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async assignStudentToRoute(req, res) {
      const context = buildRequestContext(req);
      const result = await service.assignStudentToRoute(
        req.params.routeId,
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
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

    async deactivateStudent(req, res) {
      const context = buildRequestContext(req);
      const result = await service.deactivateStudent(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getStudentMeetingPoints(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getStudentMeetingPoints(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async assignStudentMeetingPoints(req, res) {
      const context = buildRequestContext(req);
      const result = await service.assignStudentMeetingPoints(
        req.params.id,
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    // Schools
    async listSchools(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listSchools(
        req.query.zone,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getSchool(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getSchool(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async createSchool(req, res) {
      const context = buildRequestContext(req);
      const result = await service.createSchool(
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    },

    async updateSchool(req, res) {
      const context = buildRequestContext(req);
      const result = await service.updateSchool(
        req.params.id,
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async deactivateSchool(req, res) {
      const context = buildRequestContext(req);
      const result = await service.deactivateSchool(
        req.params.id,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },
  };
}

module.exports = createRoutesController;
