const { normalizeMsError } = require("../errors/normalizeMsError");
const CommunicationError = require("../errors/CommunicationError");

function createGpsService(repository) {
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
    getSession(trackingId, headers, correlationId) {
      return callRepository(
        () => repository.findTrackingSessions(trackingId, headers),
        correlationId
      );
    },

    createObservation(trackingId, data, headers, correlationId) {
      return callRepository(
        () => repository.createTrackingSessionObservation(trackingId, data, headers),
        correlationId
      );
    },

    listPositions(trackingId, query, headers, correlationId) {
      return callRepository(
        () => repository.findTrackingSessionPositions(trackingId, query, headers),
        correlationId
      );
    },

    createSession(data, idempotencyKey, headers, correlationId) {
      return callRepository(
        () => repository.createTrackingSession(data, idempotencyKey, headers),
        correlationId
      );
    },

    getControl(trackingId, headers, correlationId) {
      return callRepository(
        () => repository.findTrackingSessionControl(trackingId, headers),
        correlationId
      );
    },

    getLatestPosition(trackingId, headers, correlationId) {
      return callRepository(
        () => repository.findLatestPosition(trackingId, headers),
        correlationId
      );
    },

    finishSession(trackingId, headers, correlationId) {
      return callRepository(
        () => repository.finishTrackingSession(trackingId, headers),
        correlationId
      );
    },

    disableSession(trackingId, headers, correlationId) {
      return callRepository(
        () => repository.disableTrackingSession(trackingId, headers),
        correlationId
      );
    },
  };
}

module.exports = createGpsService;
