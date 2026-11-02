function createPathsController(service) {
  function getRequestContext(req) {
    const headers = {};
    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }
    headers["x-correlation-id"] = req.correlationId;
    return { headers, correlationId: req.correlationId };
  }

  return {
    async findAll(req, res) {
      const context = getRequestContext(req);
      const result = await service.findAll(req.query, context.headers, context.correlationId);
      res.status(200).json(result);
    },

    async search(req, res) {
      const context = getRequestContext(req);
      const result = await service.search(req.query, context.headers, context.correlationId);
      res.status(200).json(result);
    },

    async findById(req, res) {
      const context = getRequestContext(req);
      const result = await service.findById(req.params.id, context.headers, context.correlationId);
      res.status(200).json(result);
    },

    async getOverview(req, res) {
      const context = getRequestContext(req);
      const result = await service.getOverview(
        req.params.id,
        context.headers,
        context.correlationId
      );
      res.status(200).json(result);
    },

    async getFirstMeetingPoint(req, res) {
      const context = getRequestContext(req);
      const result = await service.getFirstMeetingPoint(
        req.params.id,
        context.headers,
        context.correlationId
      );
      res.status(200).json(result);
    },

    async getEndpoints(req, res) {
      const context = getRequestContext(req);
      const result = await service.getEndpoints(
        req.params.id,
        context.headers,
        context.correlationId
      );
      res.status(200).json(result);
    },

    async importKmz(req, res) {
      const context = getRequestContext(req);
      const result = await service.importKmz(
        req.body,
        context.headers,
        context.correlationId
      );
      res.status(201).json(result);
    }
  };
}

module.exports = createPathsController;
