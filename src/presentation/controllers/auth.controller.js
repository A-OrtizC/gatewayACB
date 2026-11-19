const { buildRequestContext, sendResult } = require("../utils/requestContext");

function createAuthController(service) {
  return {
    async login(req, res) {
      const context = buildRequestContext(req);
      const result = await service.login(
        req.body,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },
  };
}

module.exports = createAuthController;
