const { normalizeMsError } = require("../errors/normalizeMsError");
const CommunicationError = require("../errors/CommunicationError");

function createAdminRoutesService(repository) {
  async function callRepository(operation, correlationId) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof CommunicationError) {
        if (!error.correlationId) {
          error.correlationId = correlationId;
        }
        throw error;
      }
      throw normalizeMsError(error, { correlationId });
    }
  }

  return {
    listSchools(query, headers, correlationId) {
      return callRepository(() => repository.listSchools(query, headers), correlationId);
    },

    getSchool(id, headers, correlationId) {
      return callRepository(() => repository.findSchoolById(id, headers), correlationId);
    },

    createSchool(data, headers, correlationId) {
      return callRepository(() => repository.createSchool(data, headers), correlationId);
    },

    updateSchool(id, data, headers, correlationId) {
      return callRepository(() => repository.updateSchoolById(id, data, headers), correlationId);
    },

    deleteSchool(id, headers, correlationId) {
      return callRepository(() => repository.deactivateSchoolById(id, headers), correlationId);
    },

    listRoutes(query, headers, correlationId) {
      return callRepository(() => repository.listRoutes(query, headers), correlationId);
    },

    getRoute(id, headers, correlationId) {
      return callRepository(() => repository.findRouteById(id, headers), correlationId);
    },

    createRoute(data, headers, correlationId) {
      return callRepository(() => repository.createRoute(data, headers), correlationId);
    },

    updateRoute(id, data, headers, correlationId) {
      return callRepository(() => repository.updateRouteById(id, data, headers), correlationId);
    },

    deleteRoute(id, headers, correlationId) {
      return callRepository(() => repository.deactivateRouteById(id, headers), correlationId);
    },

    assignGuides(id, data, headers, correlationId) {
      return callRepository(() => repository.assignGuidesToRoute(id, data, headers), correlationId);
    },

    listRouteStudents(id, headers, correlationId) {
      return callRepository(() => repository.listStudentsByRoute(id, headers), correlationId);
    },

    assignStudentToRoute(id, data, headers, correlationId) {
      return callRepository(() => repository.assignStudentToRoute(id, data, headers), correlationId);
    },

    listRouteMeetingPoints(id, headers, correlationId) {
      return callRepository(() => repository.listMeetingPointsForRoute(id, headers), correlationId);
    },

    createRouteMeetingPoint(id, data, headers, correlationId) {
      return callRepository(() => repository.createMeetingPointForRoute(id, data, headers), correlationId);
    },

    getMeetingPoint(id, headers, correlationId) {
      return callRepository(() => repository.findMeetingPointById(id, headers), correlationId);
    },

    updateMeetingPoint(id, data, headers, correlationId) {
      return callRepository(() => repository.updateMeetingPointById(id, data, headers), correlationId);
    },

    deleteMeetingPoint(id, headers, correlationId) {
      return callRepository(() => repository.deleteMeetingPointById(id, headers), correlationId);
    },

    getRosterAtMeetingPoint(id, shift, headers, correlationId) {
      return callRepository(() => repository.getRosterAtMeetingPoint(id, shift, headers), correlationId);
    },

    getRouteStudent(id, headers, correlationId) {
      return callRepository(() => repository.findRouteStudentById(id, headers), correlationId);
    },

    updateRouteStudent(id, data, headers, correlationId) {
      return callRepository(() => repository.updateRouteStudentById(id, data, headers), correlationId);
    },

    deleteRouteStudent(id, headers, correlationId) {
      return callRepository(() => repository.deactivateRouteStudentById(id, headers), correlationId);
    },

    getStudentMeetingPoints(id, headers, correlationId) {
      return callRepository(() => repository.getMeetingPointsOfStudent(id, headers), correlationId);
    },

    assignStudentMeetingPoints(id, data, headers, correlationId) {
      return callRepository(() => repository.assignMeetingPointsToStudent(id, data, headers), correlationId);
    },
  };
}

module.exports = createAdminRoutesService;
