const { createRepositoryCaller } = require("../utils/callRepository");
const NotFoundError = require("../errors/NotFoundError");

function createPathsService(repository) {
  const callRepository = createRepositoryCaller();

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

    listMeetingPoints(headers, correlationId) {
      return callRepository(
        () => repository.findAllMeetingPoints(headers),
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
        ),
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
    },

    notifyStatus(data, headers, correlationId) {
      return callRepository(
        () => repository.notifyStatus(data, headers),
        correlationId
      );
    },

    validateFirstMeetingPoint(id, data, headers, correlationId) {
      return callRepository(
        () => repository.validateFirstMeetingPoint(id, data, headers),
        correlationId
      );
    },
  };
}

module.exports = createPathsService;
