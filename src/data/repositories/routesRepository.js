const { get, post, put, delete: del } = require("../clients/httpClient");

const BASE_URL = "/api/v1";

const RoutesRepository = {
  // Meeting point methods
  findMettingPointsForRoute: (routeId, headers = {}) => {
    return get("routes", `${BASE_URL}/routes/${routeId}/meeting-points`, { headers });
  },

  findMettingPointById: (meetingPointId, headers = {}) => {
    return get("routes", `${BASE_URL}/meeting-points/${meetingPointId}`, { headers });
  },

  createMettingPointsForRoute: (routeId, data, headers = {}) => {
    return post("routes", `${BASE_URL}/routes/${routeId}/meeting-points`, data, { headers });
  },

  updateMettingPointById: (meetingPointId, data, headers = {}) => {
    return put("routes", `${BASE_URL}/meeting-points/${meetingPointId}`, data, { headers });
  },

  deleteMettingPointById: (meetingPointId, headers = {}) => {
    return del("routes", `${BASE_URL}/meeting-points/${meetingPointId}`, { headers });
  },

  // Route methods
  listRoutes: (schoolId, zone, headers = {}) => {
    return get("routes", `${BASE_URL}/routes`, { headers, query: { schoolId, zone } });
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

  deleteRouteById: (id, headers = {}) => {
    return del("routes", `${BASE_URL}/routes/${id}`, { headers });
  },

  assignGuidesToRoute: (routeId, data, headers = {}) => {
    return put("routes", `${BASE_URL}/routes/${routeId}/guides`, data, { headers });
  },

  // School methods
  listSchools: (zone, headers = {}) => {
    return get("routes", `${BASE_URL}/schools`, { headers, query: { zone } });
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

  // Student methods
  listStudentsByRoute: (routeId, headers = {}) => {
    return get("routes", `${BASE_URL}/routes/${routeId}/students`, { headers });
  },

  listRouteStudentsMeetingPoints: (routeId, headers = {}) => {
    return get("routes", `${BASE_URL}/routes/${routeId}/students/meeting-points`, {
      headers,
    });
  },

  assignStudentToRoute: (routeId, data, headers = {}) => {
    return post("routes", `${BASE_URL}/routes/${routeId}/students`, data, { headers });
  },

  findStudentById: (id, headers = {}) => {
    return get("routes", `${BASE_URL}/students/${id}`, { headers });
  },

  updateStudentById: (id, data, headers = {}) => {
    return put("routes", `${BASE_URL}/students/${id}`, data, { headers });
  },

  deactivateStudentById: (id, headers = {}) => {
    return del("routes", `${BASE_URL}/students/${id}`, { headers });
  },

  assignMeetingPointsToStudent: (id, data, headers = {}) => {
    return put("routes", `${BASE_URL}/students/${id}/meeting-points`, data, { headers });
  },

  getMeetingPointsOfStudent: (id, headers = {}) => {
    return get("routes", `${BASE_URL}/students/${id}/meeting-points`, { headers });
  },

  getRosterAtMeetingPoint: (meetingPointId, shift, headers = {}) => {
    return get("routes", `${BASE_URL}/meeting-points/${meetingPointId}/students`, {
      headers,
      query: { shift },
    });
  },
};

module.exports = RoutesRepository;
