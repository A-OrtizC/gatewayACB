const { get, post, put, patch, del } = require("../clients/httpClient");

// Repositorio genérico para el microservicio de paths
// TODO: Ajustar rutas, verbos HTTP y nombres de métodos una vez que el equipo nos proporcione
// la especificación de endpoints de este microservicio.
// IMPORTANTE: Este repositorio debe ser utilizado desde la capa de lógica (orquestadores/servicios),
// nunca desde controladores directamente.

const PathsRepository = {
  // Ejemplo genérico - Reemplazar con endpoints reales
  findAll: (query = {}, headers = {}) => {
    // TODO: Reemplazar "/[recurso]" con la ruta correcta
    return get("paths", "/[recurso]", { headers, query });
  },

  findById: (id, headers = {}) => {
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return get("paths", `/[recurso]/${id}`, { headers });
  },

  create: (data, headers = {}) => {
    // TODO: Reemplazar "/[recurso]" con la ruta correcta
    return post("paths", "/[recurso]", data, { headers });
  },

  update: (id, data, headers = {}) => {
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return put("paths", `/[recurso]/${id}`, data, { headers });
  },

  partialUpdate: (id, data, headers = {}) => {
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return patch("paths", `/[recurso]/${id}`, data, { headers });
  },

  remove: (id, headers = {}) => {
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return del("paths", `/[recurso]/${id}`, { headers });
  },
};

module.exports = PathsRepository;
