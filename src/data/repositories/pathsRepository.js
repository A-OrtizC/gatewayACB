const { get, post, put, patch, del } = require("../clients/httpClient");
const pathsMock = require("../mocks/paths.mock");

// Repositorio genérico para el microservicio de paths
// TODO: Ajustar rutas, verbos HTTP y nombres de métodos una vez que el equipo nos proporcione
// la especificación de endpoints de este microservicio.
// IMPORTANTE: Este repositorio debe ser utilizado desde la capa de lógica (orquestadores/servicios),
// nunca desde controladores directamente.
// TODO: Quitar mocks al integrar con MS real

const USE_MOCK = process.env.USE_MOCK_SERVICES === "true";

const PathsRepository = {
  // Ejemplo genérico - Reemplazar con endpoints reales
  findAll: (query = {}, headers = {}) => {
    if (USE_MOCK) {
      return pathsMock.findAll(query);
    }
    // TODO: Reemplazar "/[recurso]" con la ruta correcta
    return get("paths", "/[recurso]", { headers, query });
  },

  findById: (id, headers = {}) => {
    if (USE_MOCK) {
      return pathsMock.findById(id);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return get("paths", `/[recurso]/${id}`, { headers });
  },

  create: (data, headers = {}) => {
    if (USE_MOCK) {
      return pathsMock.create(data);
    }
    // TODO: Reemplazar "/[recurso]" con la ruta correcta
    return post("paths", "/[recurso]", data, { headers });
  },

  update: (id, data, headers = {}) => {
    if (USE_MOCK) {
      return pathsMock.update(id, data);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return put("paths", `/[recurso]/${id}`, data, { headers });
  },

  partialUpdate: (id, data, headers = {}) => {
    if (USE_MOCK) {
      return pathsMock.partialUpdate(id, data);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return patch("paths", `/[recurso]/${id}`, data, { headers });
  },

  remove: (id, headers = {}) => {
    if (USE_MOCK) {
      return pathsMock.remove(id);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return del("paths", `/[recurso]/${id}`, { headers });
  },
};

module.exports = PathsRepository;
