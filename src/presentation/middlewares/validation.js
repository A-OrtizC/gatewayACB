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

function validateJsonArray(req, res, next) {
  if (!req.is("application/json") || !Array.isArray(req.body)) {
    return validationError(req, res, "El cuerpo debe ser un arreglo JSON.");
  }
  return next();
}

function validateMultipartBody(req, res, next) {
  if (!req.is("multipart/form-data") || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    return validationError(req, res, "El cuerpo debe contener un archivo multipart no vacío.");
  }
  return next();
}

function validateNumericParam(paramName, message = "El identificador no es válido.") {
  return function validateNumeric(req, res, next) {
    const value = req.params[paramName];
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
      return validationError(req, res, message);
    }
    return next();
  };
}

// Contrato de tracking.ValidID de Go: cadena opaca de hasta 256 bytes, sin
// espacios en los extremos ni caracteres de control. El gateway no debe
// imponer un formato (UUID, base64url, etc.).
function validateTrackingId(req, res, next) {
  const value = req.params.trackingId;
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > 256 ||
    value.trim() !== value ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return validationError(req, res, "El identificador de seguimiento no es válido.");
  }
  return next();
}

function validateIdempotencyKey(req, res, next) {
  const value = req.get("idempotency-key");
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > 256 ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return validationError(req, res, "La cabecera Idempotency-Key no es válida.");
  }
  return next();
}

// Paginacion de posiciones del GPS: solo after_sequence y limit, una sola vez
// cada uno, valores decimales. Go limita la pagina a 100 y usa 50 por defecto.
function validatePositionsQuery(req, res, next) {
  const allowed = new Set(["after_sequence", "limit"]);
  for (const [key, value] of Object.entries(req.query)) {
    if (!allowed.has(key) || typeof value !== "string" || !/^\d+$/.test(value)) {
      return validationError(req, res, "Los parámetros de paginación no son válidos.");
    }
  }
  if (req.query.after_sequence !== undefined) {
    const after = Number(req.query.after_sequence);
    if (!Number.isSafeInteger(after) || after < 0) {
      return validationError(req, res, "El parámetro after_sequence no es válido.");
    }
  }
  if (req.query.limit !== undefined) {
    const limit = Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return validationError(req, res, "El parámetro limit debe estar entre 1 y 100.");
    }
  }
  return next();
}

module.exports = {
  validateRouteId,
  validateQuery,
  validateJsonBody,
  validateJsonArray,
  validateMultipartBody,
  validateNumericParam,
  validateTrackingId,
  validateIdempotencyKey,
  validatePositionsQuery
};
