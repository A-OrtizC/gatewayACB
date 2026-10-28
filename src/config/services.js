const services = {
  auth: process.env.AUTH_SERVICE_URL,
  users: process.env.USERS_SERVICE_URL,
  operations: process.env.OPERATIONS_SERVICE_URL,
  routes: process.env.ROUTES_SERVICE_URL,
  gps: process.env.GPS_SERVICE_URL,
  paths: process.env.PATHS_SERVICE_URL,
};

Object.entries(services).forEach(([key, value]) => {
  if (!value) {
    console.warn(`[config/services] La variable de entorno para "${key}" no está definida.`);
  }
});

module.exports = services;
