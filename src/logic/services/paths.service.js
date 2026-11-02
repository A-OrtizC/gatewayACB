const { normalizeMsError } = require("../errors/normalizeMsError");
const CommunicationError = require("../errors/CommunicationError");
const NotFoundError = require("../errors/NotFoundError");

function createPathsService(repository) {
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
    findAll(query, headers, correlationId) {
      return callRepository(
        () => repository.findAllRoutes(query, headers),
        correlationId
      );
    },

    search(query, headers, correlationId) {
      return callRepository(
        () => repository.searchRoutes(query, headers),
        correlationId
      );
    },

    findById(id, headers, correlationId) {
      return callRepository(
        () => repository.findById(id, headers),
        correlationId
      ).then((route) => {
        if (route === null) {
          throw new NotFoundError(`No se encontró la ruta "${id}".`);
        }
        return route;
      });
    },

    async getOverview(id, headers, correlationId) {
      const route = await callRepository(
        () => repository.findById(id, headers),
        correlationId
      );

      if (route === null) {
        throw new NotFoundError(`No se encontró la ruta "${id}".`);
      }

      const [firstMeetingPoint, endpoints] = await Promise.all([
        callRepository(
          () => repository.findFirstMettingPoint(id, headers),
          correlationId
        ),
        callRepository(
          () => repository.findEndPoints(id, headers),
          correlationId
        )
      ]);

      return { route, firstMeetingPoint, endpoints };
    },

    getFirstMeetingPoint(id, headers, correlationId) {
      return callRepository(
        () => repository.findFirstMettingPoint(id, headers),
        correlationId
      );
    },

    getEndpoints(id, headers, correlationId) {
      return callRepository(
        () => repository.findEndPoints(id, headers),
        correlationId
      );
    },

    importKmz(data, headers, correlationId) {
      return callRepository(
        () => repository.createImportKMZ(data, headers),
        correlationId
      );
    }
  };
}

module.exports = createPathsService;
