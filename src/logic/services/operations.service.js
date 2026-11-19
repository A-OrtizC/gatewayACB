const { createRepositoryCaller } = require("../utils/callRepository");

function createOperationsService(repository) {
  const callRepository = createRepositoryCaller();

  return {
    // Trips
    createTrip(data, headers, correlationId) {
      return callRepository(() => repository.create(data, headers), correlationId);
    },

    getTrip(tripId, headers, correlationId) {
      return callRepository(() => repository.getTrip(tripId, headers), correlationId);
    },

    listTripGuides(tripId, headers, correlationId) {
      return callRepository(() => repository.listGuides(tripId, headers), correlationId);
    },

    replaceTripGuide(tripId, tripGuideId, data, headers, correlationId) {
      return callRepository(
        () => repository.replaceGuide(tripId, tripGuideId, data, headers),
        correlationId
      );
    },

    getTripByRouteAndDate(routeId, date, headers, correlationId) {
      return callRepository(
        () => repository.getByRouteAndDate(routeId, date, headers),
        correlationId
      );
    },

    startTrip(tripId, data, headers, correlationId) {
      return callRepository(
        () => repository.startTrip(tripId, data, headers),
        correlationId
      );
    },

    finishTrip(tripId, data, headers, correlationId) {
      return callRepository(
        () => repository.finishTrip(tripId, data, headers),
        correlationId
      );
    },

    // Trip events
    listTripEvents(tripId, headers, correlationId) {
      return callRepository(() => repository.listEvents(tripId, headers), correlationId);
    },

    registerTripEvent(tripId, data, headers, correlationId) {
      return callRepository(
        () => repository.registerEvent(tripId, data, headers),
        correlationId
      );
    },

    // Trip attendance
    initializeRoster(tripId, data, headers, correlationId) {
      return callRepository(
        () => repository.initializeRoster(tripId, data, headers),
        correlationId
      );
    },

    listStudentAttendance(tripId, headers, correlationId) {
      return callRepository(
        () => repository.listStudentAttendance(tripId, headers),
        correlationId
      );
    },

    registerOrUpdateAttendance(tripId, studentId, data, headers, correlationId) {
      return callRepository(
        () => repository.registerOrUpdateAttendance(tripId, studentId, data, headers),
        correlationId
      );
    },

    // Guide check-ins
    listGuideCheckIns(tripGuideId, headers, correlationId) {
      return callRepository(
        () => repository.listGuideCheckInAttempts(tripGuideId, headers),
        correlationId
      );
    },

    // Guide faults
    listGuideFaultCycles(guideId, headers, correlationId) {
      return callRepository(
        () => repository.listCyclesForGuide(guideId, headers),
        correlationId
      );
    },

    listMinorFaults(cycleId, headers, correlationId) {
      return callRepository(
        () => repository.listMinorFaults(cycleId, headers),
        correlationId
      );
    },

    getMajorFault(majorFaultId, headers, correlationId) {
      return callRepository(
        () => repository.getMajorFault(majorFaultId, headers),
        correlationId
      );
    },

    markMinorFaultNotified(minorFaultId, headers, correlationId) {
      return callRepository(
        () => repository.markMinorFaultNotified(minorFaultId, headers),
        correlationId
      );
    },

    markMajorFaultNotified(majorFaultId, headers, correlationId) {
      return callRepository(
        () => repository.markMajorFaultNotified(majorFaultId, headers),
        correlationId
      );
    },

    markMajorFaultMinuted(majorFaultId, headers, correlationId) {
      return callRepository(
        () => repository.markMajorFaultMinuted(majorFaultId, headers),
        correlationId
      );
    },
  };
}

module.exports = createOperationsService;
