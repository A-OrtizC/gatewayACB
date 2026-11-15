const { normalizeMsError } = require("../errors/normalizeMsError");
const CommunicationError = require("../errors/CommunicationError");

function createAuthService(repository) {
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
    login(credentials, headers, correlationId) {
      return callRepository(
        () => repository.login(credentials, headers),
        correlationId
      );
    }
  };
}

module.exports = createAuthService;
