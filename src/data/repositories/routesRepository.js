const { get, post, put, patch, del } = require("../clients/httpClient");
const routesMock = require("../mocks/routes.mock");

// Repositorio genérico para el microservicio de rutas (routes)
// TODO: Ajustar rutas, verbos HTTP y nombres de métodos una vez que el equipo nos proporcione
// la especificación de endpoints de este microservicio.
// IMPORTANTE: Este repositorio debe ser utilizado desde la capa de lógica (orquestadores/servicios),
// nunca desde controladores directamente.
// TODO: Quitar mocks al integrar con MS real

const USE_MOCK = process.env.USE_MOCK_SERVICES === "true";

const RoutesRepository = {
  // Ejemplo genérico - Reemplazar con endpoints reales
  findAll: (query = {}, headers = {}) => {
    if (USE_MOCK) {
      return routesMock.findAll(query);
    }
    // TODO: Reemplazar "/[recurso]" con la ruta correcta
    return get("routes", "/[recurso]", { headers, query });
  },

  findById: (id, headers = {}) => {
    if (USE_MOCK) {
      return routesMock.findById(id);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return get("routes", `/[recurso]/${id}`, { headers });
  },

  create: (data, headers = {}) => {
    if (USE_MOCK) {
      return routesMock.create(data);
    }
    // TODO: Reemplazar "/[recurso]" con la ruta correcta
    return post("routes", "/[recurso]", data, { headers });
  },

  update: (id, data, headers = {}) => {
    if (USE_MOCK) {
      return routesMock.update(id, data);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return put("routes", `/[recurso]/${id}`, data, { headers });
  },

  partialUpdate: (id, data, headers = {}) => {
    if (USE_MOCK) {
      return routesMock.partialUpdate(id, data);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return patch("routes", `/[recurso]/${id}`, data, { headers });
  },

  remove: (id, headers = {}) => {
    if (USE_MOCK) {
      return routesMock.remove(id);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return del("routes", `/[recurso]/${id}`, { headers });
  },
};

module.exports = RoutesRepository;
