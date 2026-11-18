const { createRepositoryCaller } = require("../utils/callRepository");

function createGpsService(repository) {
  const callRepository = createRepositoryCaller();

  return {
    createTrackingSession(data, idempotencyKey, headers, correlationId) {
      return callRepository(
        () => repository.createTrackingSession(data, idempotencyKey, headers),
        correlationId
      );
    },

    getTrackingSession(trackingId, headers, correlationId) {
      return callRepository(
        () => repository.findTrackingSessions(trackingId, headers),
        correlationId
      );
    },

    getTrackingSessionControl(trackingId, headers, correlationId) {
      return callRepository(
        () => repository.findTrackingSessionControl(trackingId, headers),
        correlationId
      );
    },

    listTrackingSessionPositions(trackingId, query, headers, correlationId) {
      return callRepository(
        () => repository.findTrackingSessionPositions(trackingId, query, headers),
        correlationId
      );
    },

    getLatestPosition(trackingId, headers, correlationId) {
      return callRepository(
        () => repository.findTrackingSessionLatestPosition(trackingId, headers),
        correlationId
      );
    },

    registerObservation(trackingId, data, headers, correlationId) {
      return callRepository(
        () => repository.createTrackingSessionObservation(trackingId, data, headers),
        correlationId
      );
    },

    disableTrackingSession(trackingId, headers, correlationId) {
      return callRepository(
        () => repository.disableTrackingSession(trackingId, headers),
        correlationId
      );
    },

    finishTrackingSession(trackingId, headers, correlationId) {
      return callRepository(
        () => repository.finishTrackingSession(trackingId, headers),
        correlationId
      );
    },
  };
}

module.exports = createGpsService;
