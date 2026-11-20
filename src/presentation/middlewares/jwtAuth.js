const jwt = require("jsonwebtoken");

function authError(req, res, status, code, message) {
  return res.status(status).json({
    error: {
      code,
      message,
      correlationId: req.correlationId,
    },
  });
}

// Tracking control/read routes require the same HS256 JWT used by adminACB.
// Observations stay outside this middleware: their per-session Bearer is the
// GPS credential, not the app session token.
function requireTrackingAuth(req, res, next) {
  const secret = process.env.ACB_JWT_SECRET;
  if (!secret) {
    return authError(
      req,
      res,
      503,
      "SERVICE_NOT_CONFIGURED",
      "El gateway no tiene configurado ACB_JWT_SECRET para tracking."
    );
  }

  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return authError(
      req,
      res,
      401,
      "UNAUTHORIZED",
      "Falta la credencial de sesión para tracking."
    );
  }

  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return authError(
      req,
      res,
      401,
      "INVALID_TOKEN",
      "La credencial de sesión no es válida para tracking."
    );
  }

  const id = Number(payload.sub);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return authError(
      req,
      res,
      401,
      "INVALID_TOKEN",
      "La credencial de sesión no identifica un usuario válido."
    );
  }

  req.auth = {
    id,
    role: typeof payload.role === "string" ? payload.role : null,
  };
  return next();
}

function requireGuide(req, res, next) {
  if (req.auth?.role !== "GUIDE") {
    return authError(
      req,
      res,
      403,
      "FORBIDDEN",
      "Solo un guía puede iniciar una sesión de tracking."
    );
  }
  return next();
}

module.exports = { requireTrackingAuth, requireGuide };
