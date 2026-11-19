const { get, post, put, del } = require("../clients/httpClient");

const BASE_URL = "/api/v1";

// Repositorio del servicio admin_routes. Publica colegios, rutas
// administrativas, puntos de encuentro y la matricula de estudiantes en rutas.
const RoutesRepository = {
  // ---- Colegios ----
  listSchools: (query = {}, headers = {}) => {
    return get("routes", `${BASE_URL}/schools`, { headers, query });
  },

  findSchoolById: (id, headers = {}) => {
    return get("routes", `${BASE_URL}/schools/${id}`, { headers });
  },

  createSchool: (data, headers = {}) => {
    return post("routes", `${BASE_URL}/schools`, data, { headers });
  },

  updateSchoolById: (id, data, headers = {}) => {
    return put("routes", `${BASE_URL}/schools/${id}`, data, { headers });
  },

  deactivateSchoolById: (id, headers = {}) => {
    return del("routes", `${BASE_URL}/schools/${id}`, { headers });
  },

  // ---- Rutas administrativas ----
  listRoutes: (query = {}, headers = {}) => {
    return get("routes", `${BASE_URL}/routes`, { headers, query });
  },

  findRouteById: (id, headers = {}) => {
    return get("routes", `${BASE_URL}/routes/${id}`, { headers });
  },

  createRoute: (data, headers = {}) => {
    return post("routes", `${BASE_URL}/routes`, data, { headers });
  },

  updateRouteById: (id, data, headers = {}) => {
    return put("routes", `${BASE_URL}/routes/${id}`, data, { headers });
  },

  deactivateRouteById: (id, headers = {}) => {
    return del("routes", `${BASE_URL}/routes/${id}`, { headers });
  },

  assignGuidesToRoute: (routeId, data, headers = {}) => {
    return put("routes", `${BASE_URL}/routes/${routeId}/guides`, data, { headers });
  },

  // ---- Estudiantes matriculados en una ruta ----
  listStudentsByRoute: (routeId, headers = {}) => {
    return get("routes", `${BASE_URL}/routes/${routeId}/students`, { headers });
  },

  assignStudentToRoute: (routeId, data, headers = {}) => {
    return post("routes", `${BASE_URL}/routes/${routeId}/students`, data, { headers });
  },

  findRouteStudentById: (id, headers = {}) => {
    return get("routes", `${BASE_URL}/students/${id}`, { headers });
  },

  updateRouteStudentById: (id, data, headers = {}) => {
    return put("routes", `${BASE_URL}/students/${id}`, data, { headers });
  },

  deactivateRouteStudentById: (id, headers = {}) => {
    return del("routes", `${BASE_URL}/students/${id}`, { headers });
  },

  getMeetingPointsOfStudent: (id, headers = {}) => {
    return get("routes", `${BASE_URL}/students/${id}/meeting-points`, { headers });
  },

  assignMeetingPointsToStudent: (id, data, headers = {}) => {
    return put("routes", `${BASE_URL}/students/${id}/meeting-points`, data, { headers });
  },

  // ---- Puntos de encuentro ----
  listMeetingPointsForRoute: (routeId, headers = {}) => {
    return get("routes", `${BASE_URL}/routes/${routeId}/meeting-points`, { headers });
  },

  createMeetingPointForRoute: (routeId, data, headers = {}) => {
    return post("routes", `${BASE_URL}/routes/${routeId}/meeting-points`, data, { headers });
  },

  findMeetingPointById: (id, headers = {}) => {
    return get("routes", `${BASE_URL}/meeting-points/${id}`, { headers });
  },

  updateMeetingPointById: (id, data, headers = {}) => {
    return put("routes", `${BASE_URL}/meeting-points/${id}`, data, { headers });
  },

  deleteMeetingPointById: (id, headers = {}) => {
    return del("routes", `${BASE_URL}/meeting-points/${id}`, { headers });
  },

  getRosterAtMeetingPoint: (meetingPointId, shift, headers = {}) => {
    return get("routes", `${BASE_URL}/meeting-points/${meetingPointId}/students`, {
      headers,
      query: { shift },
    });
  },
};

module.exports = RoutesRepository;
