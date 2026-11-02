function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: "ENDPOINT_NOT_FOUND",
      message: `No existe el endpoint ${req.method} ${req.path}.`,
      correlationId: req.correlationId
    }
  });
}

module.exports = notFoundHandler;
