const { getRequestContext, sendResult } = require("./controllerContext");

function createOperationsController(service) {
  return {
    async listGuideCheckInAttempts(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listGuideCheckInAttempts(
        req.params.tripGuideId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async recordGeolocationResult(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.recordGeolocationResult(
        req.params.tripGuideId,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result, 201);
    },

    async listCyclesForGuide(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listCyclesForGuide(
        req.params.guideId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async listMinorFaults(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listMinorFaults(
        req.params.cycleId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async getMajorFault(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getMajorFault(
        req.params.majorFaultId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async markMinorFaultNotified(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.markMinorFaultNotified(
        req.params.minorFaultId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async markMajorFaultNotified(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.markMajorFaultNotified(
        req.params.majorFaultId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async markMajorFaultMinuted(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      await service.markMajorFaultMinuted(
        req.params.majorFaultId,
        headers,
        correlationId
      );
      res.status(204).end();
    },

    async createTrip(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.createTrip(req.body, headers, correlationId);
      sendResult(res, result, 201);
    },

    async getTrip(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getTrip(req.params.tripId, headers, correlationId);
      sendResult(res, result);
    },

    async listTripGuides(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listTripGuides(
        req.params.tripId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async replaceGuide(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.replaceGuide(
        req.params.tripId,
        req.params.tripGuideId,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async getTripByRouteAndDate(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.getTripByRouteAndDate(
        req.params.routeId,
        req.query.date,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async startTrip(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.startTrip(
        req.params.tripId,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async finishTrip(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.finishTrip(
        req.params.tripId,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async listTripEvents(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listTripEvents(
        req.params.tripId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async registerTripEvent(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.registerTripEvent(
        req.params.tripId,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result, 201);
    },

    async initializeRoster(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.initializeRoster(
        req.params.tripId,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result, 201);
    },

    async listStudentAttendance(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.listStudentAttendance(
        req.params.tripId,
        headers,
        correlationId
      );
      sendResult(res, result);
    },

    async registerOrUpdateAttendance(req, res) {
      const { headers, correlationId } = getRequestContext(req);
      const result = await service.registerOrUpdateAttendance(
        req.params.tripId,
        req.params.studentId,
        req.body,
        headers,
        correlationId
      );
      sendResult(res, result);
    },
  };
}

module.exports = createOperationsController;
