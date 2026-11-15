function createAuthController(service) {
  function getRequestContext(req) {
    const headers = {};
    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }
    headers["x-correlation-id"] = req.correlationId;
    return { headers, correlationId: req.correlationId };
  }

  return {
    async login(req, res) {
      const context = getRequestContext(req);
      const result = await service.login(
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(200).json(result);
    }
  };
}

module.exports = createAuthController;
