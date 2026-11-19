const { createRepositoryCaller } = require("../utils/callRepository");

function createAuthService(repository) {
  const callRepository = createRepositoryCaller();

  return {
    login(credentials, headers, correlationId) {
      return callRepository(
        () => repository.login(credentials, headers),
        correlationId
      );
    },
  };
}

module.exports = createAuthService;
