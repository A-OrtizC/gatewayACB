const services = {
  auth: process.env.AUTH_SERVICE_URL,
  users: process.env.USERS_SERVICE_URL,
  operations: process.env.OPERATIONS_SERVICE_URL,
  routes: process.env.ROUTES_SERVICE_URL,
  gps: process.env.GPS_SERVICE_URL,
  paths: process.env.PATHS_SERVICE_URL,
};

const missing = Object.entries(services)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.warn(
    `[config/services] Faltan variables de entorno para: ${missing.join(", ")}. ` +
      "Los endpoints que dependan de esos servicios fallaran con SERVICE_NOT_CONFIGURED."
  );
}

// Se invoca al arrancar el proceso (server.js), no al construir la app, para que
// las pruebas puedan inyectar servicios sin exigir todas las variables.
function assertConfigured() {
  if (missing.length > 0) {
    throw new Error(
      `[config/services] Configuracion incompleta. Define: ${missing
        .map((key) => `${key.toUpperCase()}_SERVICE_URL`)
        .join(", ")}.`
    );
  }
}

module.exports = services;
Object.defineProperties(module.exports, {
  assertConfigured: { value: assertConfigured },
  missing: { value: missing },
});
