const cluster = require("node:cluster");
const jwt = require("jsonwebtoken");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { ClusterMemoryStoreWorker } = require("@express-rate-limit/cluster-memory-store");

const OBSERVATIONS_PATH = /^\/api\/v1\/tracking-sessions\/([^/]+)\/observations\/?$/;

// Under node:cluster each worker keeps no counters of its own: the primary
// holds them (see server.cluster.js). Returning undefined keeps the default
// in-memory store.
function defaultStoreFactory(prefix) {
  return cluster.isWorker ? new ClusterMemoryStoreWorker({ prefix }) : undefined;
}

function authenticatedUserId(req) {
  const secret = process.env.ACB_JWT_SECRET;
  const [scheme, token] = (req.get("authorization") || "").split(" ");
  if (!secret || scheme !== "Bearer" || !token) {
    return null;
  }

  try {
    const id = Number(jwt.verify(token, secret, { algorithms: ["HS256"] }).sub);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function generalKey(req) {
  const observation = req.method === "POST" && OBSERVATIONS_PATH.exec(req.path);
  if (observation) {
    return `trk:${observation[1]}`;
  }

  const userId = authenticatedUserId(req);
  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${ipKeyGenerator(req.ip)}`;
}

function loginKey(req) {
  const username =
    typeof req.body?.username === "string"
      ? req.body.username.trim().toLowerCase().slice(0, 256)
      : "";
  return `login:${ipKeyGenerator(req.ip)}:${username}`;
}

function secondsUntil(resetTime, windowMs) {
  const remaining = resetTime ? resetTime.getTime() - Date.now() : windowMs;
  return Math.max(1, Math.ceil(remaining / 1000));
}

function handleLimitReached(req, res, next, options) {
  const retryAfter =
    res.get("Retry-After") || String(secondsUntil(req.rateLimit.resetTime, options.windowMs));
  res.set("Retry-After", retryAfter);

  const keyType = req.rateLimit.key.split(":")[0];
  console.warn(
    `[gateway] ${req.correlationId} RATE_LIMITED ${req.method} ${req.path} ${keyType}`
  );

  return res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: `Demasiadas solicitudes. Intenta de nuevo en ${retryAfter} segundos.`,
      correlationId: req.correlationId,
    },
  });
}

function createRateLimiters(config, storeFactory = defaultStoreFactory) {
  const common = {
    windowMs: config.windowMs,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: handleLimitReached,
  };

  return {
    general: rateLimit({
      ...common,
      limit: config.max,
      keyGenerator: generalKey,
      skip: (req) => req.method === "GET" && req.path === "/api/v1/health",
      store: storeFactory("general:"),
    }),
    login: rateLimit({
      ...common,
      limit: config.loginMax,
      keyGenerator: loginKey,
      store: storeFactory("login:"),
    }),
  };
}

module.exports = createRateLimiters;
