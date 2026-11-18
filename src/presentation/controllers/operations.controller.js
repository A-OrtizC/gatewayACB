const { buildRequestContext, sendResult } = require("../utils/requestContext");

function createOperationsController(service, orchestrator) {
  return {
    // Trips
    async createTrip(req, res) {
      const context = buildRequestContext(req);
      const result = await service.createTrip(
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    },

    async getTrip(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getTrip(
        req.params.tripId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async listTripGuides(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listTripGuides(
        req.params.tripId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async replaceTripGuide(req, res) {
      const context = buildRequestContext(req);
      const result = await service.replaceTripGuide(
        req.params.tripId,
        req.params.tripGuideId,
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getTripByRouteAndDate(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getTripByRouteAndDate(
        req.params.routeId,
        req.query.date,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async startTrip(req, res) {
      const context = buildRequestContext(req);
      const result = await service.startTrip(
        req.params.tripId,
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    // El componente Go rechaza cualquier cuerpo en finish; no se reenvía nada.
    async finishTrip(req, res) {
      const context = buildRequestContext(req);
      const result = await service.finishTrip(
        req.params.tripId,
        undefined,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getTripOverview(req, res) {
      const context = buildRequestContext(req);
      const result = await orchestrator.getOverview(
        req.params.tripId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    // Trip events
    async listTripEvents(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listTripEvents(
        req.params.tripId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async registerTripEvent(req, res) {
      const context = buildRequestContext(req);
      const result = await service.registerTripEvent(
        req.params.tripId,
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    },

    // Attendance
    async initializeRoster(req, res) {
      const context = buildRequestContext(req);
      const result = await service.initializeRoster(
        req.params.tripId,
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    },

    async listStudentAttendance(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listStudentAttendance(
        req.params.tripId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async registerOrUpdateAttendance(req, res) {
      const context = buildRequestContext(req);
      const result = await service.registerOrUpdateAttendance(
        req.params.tripId,
        req.params.studentId,
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    // Guide check-in audit (read only)
    async listGuideCheckIns(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listGuideCheckIns(
        req.params.tripGuideId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    // Guide faults
    async listGuideFaultCycles(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listGuideFaultCycles(
        req.params.guideId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async listMinorFaults(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listMinorFaults(
        req.params.cycleId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getMajorFault(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getMajorFault(
        req.params.majorFaultId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async markMinorFaultNotified(req, res) {
      const context = buildRequestContext(req);
      const result = await service.markMinorFaultNotified(
        req.params.minorFaultId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async markMajorFaultNotified(req, res) {
      const context = buildRequestContext(req);
      const result = await service.markMajorFaultNotified(
        req.params.majorFaultId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async markMajorFaultMinuted(req, res) {
      const context = buildRequestContext(req);
      const result = await service.markMajorFaultMinuted(
        req.params.majorFaultId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },
  };
}

module.exports = createOperationsController;
