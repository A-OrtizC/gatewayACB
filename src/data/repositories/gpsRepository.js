const { get, post, put, patch, del } = require("../clients/httpClient");

// Repositorio genérico para el microservicio de GPS (gps)
// TODO: Ajustar rutas, verbos HTTP y nombres de métodos una vez que el equipo nos proporcione
// la especificación de endpoints de este microservicio.
// IMPORTANTE: Este repositorio debe ser utilizado desde la capa de lógica (orquestadores/servicios),
// nunca desde controladores directamente.

const GpsRepository = {
  // Ejemplo genérico - Reemplazar con endpoints reales
  findAll: (query = {}, headers = {}) => {
    // TODO: Reemplazar "/[recurso]" con la ruta correcta
    return get("gps", "/[recurso]", { headers, query });
  },

  findById: (id, headers = {}) => {
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return get("gps", `/[recurso]/${id}`, { headers });
  },

  create: (data, headers = {}) => {
    // TODO: Reemplazar "/[recurso]" con la ruta correcta
    return post("gps", "/[recurso]", data, { headers });
  },

  update: (id, data, headers = {}) => {
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return put("gps", `/[recurso]/${id}`, data, { headers });
  },

  partialUpdate: (id, data, headers = {}) => {
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return patch("gps", `/[recurso]/${id}`, data, { headers });
  },

  remove: (id, headers = {}) => {
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return del("gps", `/[recurso]/${id}`, { headers });
  },
};

module.exports = GpsRepository;
