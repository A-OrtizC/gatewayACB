const { normalizeMsError } = require("../errors/normalizeMsError");
const CommunicationError = require("../errors/CommunicationError");

function createRepositoryCaller() {
  return async function callRepository(operation, correlationId) {
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
  };
}

module.exports = { createRepositoryCaller };
