function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = {
  windowMs: positiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  max: positiveInteger(process.env.RATE_LIMIT_MAX, 120),
  loginMax: positiveInteger(process.env.RATE_LIMIT_LOGIN_MAX, 5),
  trustProxy: process.env.TRUST_PROXY || "loopback, linklocal, uniquelocal",
};
