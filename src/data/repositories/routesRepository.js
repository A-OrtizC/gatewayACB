const { get, post, put, patch, del } = require("../clients/httpClient");
const pathsMock = require("../mocks/paths.mock");

const BASE_URL = "/api/v1";

const RoutesRepository = {
  // MettingPoint methods
  findMettingPointsForRoute: (routeId, headers = {}) => {
    return get("routes", `${BASE_URL}/routes/${routeId}/meeting-points`, { headers });
  },
  
  findMettingPointById: (meetingPointId, headers = {}) => {
    return get("routes", `${BASE_URL}/meeting-points/${meetingPointId}`, { headers });
  },

  createMettingPointsForRoute: (routeId, data, headers = {}) => {
    return post("routes", `${BASE_URL}/routes/${routeId}/meeting-points`, { headers, data });
  },

  updateMettingPointById: (meetingPointId, data, headers = {}) => {
    return put("routes", `${BASE_URL}/meeting-points/${meetingPointId}`, { headers, data });
  },

  deleteMettingPointById: (meetingPointId, headers = {}) => {
    return del("routes", `${BASE_URL}/${routeId}/meeting-points/${meetingPointId}`, { headers });
  },

  // Routes methods
  listRoutes: (schoolId, zone, headers = {}) => {
    return get("routes", `${BASE_URL}/routes`, { headers, params: { schoolId, zone } });
  },

  findRouteById: (id, headers = {}) => {
    return get("routes", `${BASE_URL}/routes/${id}`, { headers });
  },

  createRoute: (data, headers = {}) => {
    return post("routes", `${BASE_URL}/routes`, { headers, data });
  },

  updateRouteById: (id, data, headers = {}) => {
    return put("routes", `${BASE_URL}/routes/${id}`, { headers, data });
  },

  deleteRouteById: (id, headers = {}) => {
    return del("routes", `${BASE_URL}/routes/${id}`, { headers });
  },

  assignGuidesToRoute: (routeId, data, headers = {}) => {
    return put("routes", `${BASE_URL}/routes/${routeId}/guides`, { headers, data });
  },

  // Shool methods
  listSchools: (zone, headers = {}) => {
    return get("schools", `${BASE_URL}/schools`, { headers, params: { zone } });
  },

  findSchoolById: (id, headers = {}) => {
    return get("schools", `${BASE_URL}/schools/${id}`, { headers });
  },

  createSchool: (data, headers = {}) => {
    return post("schools", `${BASE_URL}/schools`, { headers, data });
  },

  updateSchoolById: (id, data, headers = {}) => {
    return put("schools", `${BASE_URL}/schools/${id}`, { headers, data });
  },

  deactivateSchoolById: (id, headers = {}) => {
    return del("schools", `${BASE_URL}/schools/${id}`, { headers });
  },

  // student methods
  listStudentsByRoute: (routeId, headers = {}) => {
    return get("students", `${BASE_URL}/routes/${routeId}/students`, { headers });
  },

  assignStudentToRoute: (routeId, data, headers = {}) => {
    return post("students", `${BASE_URL}/routes/${routeId}/students`, { headers, data });
  },

  findStudentById: (id, headers = {}) => {
    return get("students", `${BASE_URL}/students/${id}`, { headers });
  },

  updateStudentById: (id, data, headers = {}) => {
    return put("students", `${BASE_URL}/students/${id}`, { headers, data });
  },

  deactivateStudentById: (id, headers = {}) => {
    return del("students", `${BASE_URL}/students/${id}`, { headers });
  },

  assignMeetingPointsToStudent: (id, data, headers = {}) => {
    return put("students", `${BASE_URL}/students/${id}/meeting-points`, { headers, data });
  },

  getMeetingPointsOfStudent: (id, headers = {}) => {
    return get("students", `${BASE_URL}/students/${id}/meeting-points`, { headers });
  },

  getRosterAtMeetingPoint: (meetingPointId, shift, headers = {}) => {
    return get("students", `${BASE_URL}/meeting-points/${meetingPointId}/students`, { headers, params: { shift } });
  },
};

module.exports = RoutesRepository;