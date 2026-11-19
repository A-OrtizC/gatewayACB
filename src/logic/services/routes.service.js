const { createRepositoryCaller } = require("../utils/callRepository");

function createRoutesService(repository) {
  const callRepository = createRepositoryCaller();

  return {
    // Routes
    listRoutes(schoolId, zone, headers, correlationId) {
      return callRepository(
        () => repository.listRoutes(schoolId, zone, headers),
        correlationId
      );
    },

    getRoute(id, headers, correlationId) {
      return callRepository(() => repository.findRouteById(id, headers), correlationId);
    },

    createRoute(data, headers, correlationId) {
      return callRepository(() => repository.createRoute(data, headers), correlationId);
    },

    updateRoute(id, data, headers, correlationId) {
      return callRepository(
        () => repository.updateRouteById(id, data, headers),
        correlationId
      );
    },

    deactivateRoute(id, headers, correlationId) {
      return callRepository(
        () => repository.deleteRouteById(id, headers),
        correlationId
      );
    },

    assignGuidesToRoute(routeId, data, headers, correlationId) {
      return callRepository(
        () => repository.assignGuidesToRoute(routeId, data, headers),
        correlationId
      );
    },

    // Meeting points
    listMeetingPointsForRoute(routeId, headers, correlationId) {
      return callRepository(
        () => repository.findMettingPointsForRoute(routeId, headers),
        correlationId
      );
    },

    getMeetingPoint(id, headers, correlationId) {
      return callRepository(
        () => repository.findMettingPointById(id, headers),
        correlationId
      );
    },

    createMeetingPoint(routeId, data, headers, correlationId) {
      return callRepository(
        () => repository.createMettingPointsForRoute(routeId, data, headers),
        correlationId
      );
    },

    updateMeetingPoint(id, data, headers, correlationId) {
      return callRepository(
        () => repository.updateMettingPointById(id, data, headers),
        correlationId
      );
    },

    deleteMeetingPoint(id, headers, correlationId) {
      return callRepository(
        () => repository.deleteMettingPointById(id, headers),
        correlationId
      );
    },

    getRosterAtMeetingPoint(meetingPointId, shift, headers, correlationId) {
      return callRepository(
        () => repository.getRosterAtMeetingPoint(meetingPointId, shift, headers),
        correlationId
      );
    },

    // Students
    listStudentsByRoute(routeId, headers, correlationId) {
      return callRepository(
        () => repository.listStudentsByRoute(routeId, headers),
        correlationId
      );
    },

    listRouteStudentsMeetingPoints(routeId, headers, correlationId) {
      return callRepository(
        () => repository.listRouteStudentsMeetingPoints(routeId, headers),
        correlationId
      );
    },

    assignStudentToRoute(routeId, data, headers, correlationId) {
      return callRepository(
        () => repository.assignStudentToRoute(routeId, data, headers),
        correlationId
      );
    },

    getStudent(id, headers, correlationId) {
      return callRepository(
        () => repository.findStudentById(id, headers),
        correlationId
      );
    },

    updateStudent(id, data, headers, correlationId) {
      return callRepository(
        () => repository.updateStudentById(id, data, headers),
        correlationId
      );
    },

    deactivateStudent(id, headers, correlationId) {
      return callRepository(
        () => repository.deactivateStudentById(id, headers),
        correlationId
      );
    },

    getStudentMeetingPoints(id, headers, correlationId) {
      return callRepository(
        () => repository.getMeetingPointsOfStudent(id, headers),
        correlationId
      );
    },

    assignStudentMeetingPoints(id, data, headers, correlationId) {
      return callRepository(
        () => repository.assignMeetingPointsToStudent(id, data, headers),
        correlationId
      );
    },

    // Schools
    listSchools(zone, headers, correlationId) {
      return callRepository(() => repository.listSchools(zone, headers), correlationId);
    },

    getSchool(id, headers, correlationId) {
      return callRepository(() => repository.findSchoolById(id, headers), correlationId);
    },

    createSchool(data, headers, correlationId) {
      return callRepository(() => repository.createSchool(data, headers), correlationId);
    },

    updateSchool(id, data, headers, correlationId) {
      return callRepository(
        () => repository.updateSchoolById(id, data, headers),
        correlationId
      );
    },

    deactivateSchool(id, headers, correlationId) {
      return callRepository(
        () => repository.deactivateSchoolById(id, headers),
        correlationId
      );
    },
  };
}

module.exports = createRoutesService;
