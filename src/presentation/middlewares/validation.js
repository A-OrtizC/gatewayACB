function validationError(req, res, message) {
  return res.status(400).json({
    error: {
      code: "INVALID_REQUEST",
      message,
      correlationId: req.correlationId
    }
  });
}

function validateRouteId(req, res, next) {
  const id = req.params.id;
  if (!id || id.length > 128 || id.trim() !== id || /[\u0000-\u001f]/.test(id)) {
    return validationError(req, res, "El identificador de ruta no es válido.");
  }
  return next();
}

function validateQuery(req, res, next) {
  for (const [key, value] of Object.entries(req.query)) {
    const values = Array.isArray(value) ? value : [value];
    if (
      !key ||
      values.some((item) => typeof item !== "string" || item.length > 500)
    ) {
      return validationError(req, res, "Los parámetros de consulta no son válidos.");
    }
  }
  return next();
}

function validateJsonBody(req, res, next) {
  if (
    !req.is("application/json") ||
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {
    return validationError(req, res, "El cuerpo debe ser un objeto JSON.");
  }
  return next();
}

module.exports = { validateRouteId, validateQuery, validateJsonBody };
