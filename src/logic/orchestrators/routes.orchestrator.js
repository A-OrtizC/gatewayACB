const timeouts = require("../../config/timeouts");
const { withTimeout } = require("../utils/withTimeout");
const { normalizeMsError } = require("../errors/normalizeMsError");
const NotFoundError = require("../errors/NotFoundError");

function createRoutesOrchestrator(routesService) {
  return {
    async getOverview(routeId, headers, correlationId) {
      const work = Promise.all([
        routesService.getRoute(routeId, headers, correlationId),
        routesService.listMeetingPointsForRoute(routeId, headers, correlationId),
        routesService.listStudentsByRoute(routeId, headers, correlationId),
      ]).then(([route, meetingPoints, students]) => {
        if (route === null || route === undefined) {
          throw new NotFoundError(`No se encontró la ruta administrativa "${routeId}".`);
        }
        return { route, meetingPoints, students };
      });

      try {
        return await withTimeout(work, timeouts.defaults.orchestrator, {
          label: `routes.overview:${routeId}`,
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

module.exports = createRoutesOrchestrator;
