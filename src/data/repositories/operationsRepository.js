const { get, post, put, patch, del } = require("../clients/httpClient");
const operationsMock = require("../mocks/operations.mock");

// Repositorio genérico para el microservicio de operaciones (operations)
// TODO: Ajustar rutas, verbos HTTP y nombres de métodos una vez que el equipo nos proporcione
// la especificación de endpoints de este microservicio.
// IMPORTANTE: Este repositorio debe ser utilizado desde la capa de lógica (orquestadores/servicios),
// nunca desde controladores directamente.
// TODO: Quitar mocks al integrar con MS real

const USE_MOCK = process.env.USE_MOCK_SERVICES === "true";

const OperationsRepository = {
  // Ejemplo genérico - Reemplazar con endpoints reales
  findAll: (query = {}, headers = {}) => {
    if (USE_MOCK) {
      return operationsMock.findAll(query);
    }
    // TODO: Reemplazar "/[recurso]" con la ruta correcta
    return get("operations", "/[recurso]", { headers, query });
  },

  findById: (id, headers = {}) => {
    if (USE_MOCK) {
      return operationsMock.findById(id);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return get("operations", `/[recurso]/${id}`, { headers });
  },

  create: (data, headers = {}) => {
    if (USE_MOCK) {
      return operationsMock.create(data);
    }
    // TODO: Reemplazar "/[recurso]" con la ruta correcta
    return post("operations", "/[recurso]", data, { headers });
  },

  update: (id, data, headers = {}) => {
    if (USE_MOCK) {
      return operationsMock.update(id, data);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return put("operations", `/[recurso]/${id}`, data, { headers });
  },

  partialUpdate: (id, data, headers = {}) => {
    if (USE_MOCK) {
      return operationsMock.partialUpdate(id, data);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return patch("operations", `/[recurso]/${id}`, data, { headers });
  },

  remove: (id, headers = {}) => {
    if (USE_MOCK) {
      return operationsMock.remove(id);
    }
    // TODO: Reemplazar "/[recurso]/:id" con la ruta correcta
    return del("operations", `/[recurso]/${id}`, { headers });
  },
};

module.exports = OperationsRepository;
