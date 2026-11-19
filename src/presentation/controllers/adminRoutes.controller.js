const { getRequestContext, sendResult } = require("./controllerContext");

function createAdminRoutesController(service) {
  return {
    async listSchools(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listSchools(req.query, headers, correlationId);
      sendResult(res, result);
    },

    async getSchool(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getSchool(req.params.id, headers, correlationId);
      sendResult(res, result);
    },

    async createSchool(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.createSchool(req.body, headers, correlationId);
      sendResult(res, result, 201);
    },

    async updateSchool(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.updateSchool(
        req.params.id,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async deleteSchool(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      await service.deleteSchool(req.params.id, headers, correlationId);
      res.status(204).end();
    },

    async listRoutes(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listRoutes(req.query, headers, correlationId);
      sendResult(res, result);
    },

    async getRoute(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getRoute(req.params.id, headers, correlationId);
      sendResult(res, result);
    },

    async createRoute(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.createRoute(req.body, headers, correlationId);
      sendResult(res, result, 201);
    },

    async updateRoute(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.updateRoute(
        req.params.id,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async deleteRoute(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      await service.deleteRoute(req.params.id, headers, correlationId);
      res.status(204).end();
    },

    async assignGuides(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.assignGuides(
        req.params.id,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async listRouteStudents(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listRouteStudents(
        req.params.id,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async assignStudentToRoute(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.assignStudentToRoute(
        req.params.id,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result, 201);
    },

    async listRouteMeetingPoints(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listRouteMeetingPoints(
        req.params.id,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async createRouteMeetingPoint(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.createRouteMeetingPoint(
        req.params.id,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result, 201);
    },

    async getMeetingPoint(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getMeetingPoint(
        req.params.id,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async updateMeetingPoint(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.updateMeetingPoint(
        req.params.id,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async deleteMeetingPoint(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      await service.deleteMeetingPoint(req.params.id, headers, correlationId);
      res.status(204).end();
    },

    async getRosterAtMeetingPoint(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getRosterAtMeetingPoint(
        req.params.id,
        req.query.shift,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async getRouteStudent(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getRouteStudent(
        req.params.id,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async updateRouteStudent(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.updateRouteStudent(
        req.params.id,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async deleteRouteStudent(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      await service.deleteRouteStudent(req.params.id, headers, correlationId);
      res.status(204).end();
    },

    async getStudentMeetingPoints(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getStudentMeetingPoints(
        req.params.id,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async assignStudentMeetingPoints(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.assignStudentMeetingPoints(
        req.params.id,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result);
    },
  };
}

module.exports = createAdminRoutesController;
