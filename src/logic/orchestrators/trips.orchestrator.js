const timeouts = require("../../config/timeouts");
const { withTimeout } = require("../utils/withTimeout");
const { normalizeMsError } = require("../errors/normalizeMsError");

function createTripsOrchestrator(operationsService) {
  return {
    async getOverview(tripId, headers, correlationId) {
      const work = Promise.all([
        operationsService.getTrip(tripId, headers, correlationId),
        operationsService.listTripGuides(tripId, headers, correlationId),
        operationsService.listStudentAttendance(tripId, headers, correlationId),
        operationsService.listTripEvents(tripId, headers, correlationId),
      ]).then(([trip, guides, attendance, events]) => ({
        trip,
        guides,
        attendance,
        events,
      }));

      try {
        return await withTimeout(work, timeouts.defaults.orchestrator, {
          label: `trips.overview:${tripId}`,
        });
      } catch (error) {
        if (error.name === "OrchestratorTimeoutError") {
          throw normalizeMsError(error, { correlationId });
        }
        throw error;
      }
    },
  };
}

module.exports = createTripsOrchestrator;
