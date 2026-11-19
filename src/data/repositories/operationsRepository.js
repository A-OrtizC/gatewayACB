const { get, post, put } = require("../clients/httpClient");

const BASE_URL = "/api/v1";

const OperationsRepository = {
  // Guide check-in audit (the internal write endpoint is intentionally not exposed)
  listGuideCheckInAttempts: (tripGuideId, headers = {}) => {
    return get("operations", `${BASE_URL}/trip-guides/${tripGuideId}/check-ins`, { headers });
  },

  // Internal geolocation result. Kept in the data layer for the GPS integration,
  // but not mounted on any public gateway route.
  recordGeolocationResult: (tripGuideId, data, headers = {}) => {
    return post(
      "operations",
      `${BASE_URL}/internal/trip-guides/${tripGuideId}/check-ins`,
      data,
      { headers }
    );
  },

  // Guide fault methods
  listCyclesForGuide: (guideId, headers = {}) => {
    return get("operations", `${BASE_URL}/guide-faults/guides/${guideId}/cycles`, { headers });
  },
  listMinorFaults: (cycleId, headers = {}) => {
    return get("operations", `${BASE_URL}/guide-faults/cycles/${cycleId}/minor`, { headers });
  },
  getMajorFault: (majorFaultId, headers = {}) => {
    return get("operations", `${BASE_URL}/guide-faults/major/${majorFaultId}`, { headers });
  },
  markMinorFaultNotified: (minorFaultId, headers = {}) => {
    return put("operations", `${BASE_URL}/guide-faults/minor/${minorFaultId}/notified`, undefined, {
      headers,
    });
  },
  markMajorFaultNotified: (majorFaultId, headers = {}) => {
    return put("operations", `${BASE_URL}/guide-faults/major/${majorFaultId}/notified`, undefined, {
      headers,
    });
  },
  markMajorFaultMinuted: (majorFaultId, headers = {}) => {
    return put("operations", `${BASE_URL}/guide-faults/major/${majorFaultId}/minuted`, undefined, {
      headers,
    });
  },

  // Trip methods
  create: (data, headers = {}) => {
    return post("operations", `${BASE_URL}/trips`, data, { headers });
  },
  getTrip: (tripId, headers = {}) => {
    return get("operations", `${BASE_URL}/trips/${tripId}`, { headers });
  },
  listGuides: (tripId, headers = {}) => {
    return get("operations", `${BASE_URL}/trips/${tripId}/guides`, { headers });
  },
  replaceGuide: (tripId, tripGuideId, data, headers = {}) => {
    return put(
      "operations",
      `${BASE_URL}/trips/${tripId}/guides/${tripGuideId}/replacement`,
      data,
      { headers }
    );
  },
  getByRouteAndDate: (routeId, date, headers = {}) => {
    return get("operations", `${BASE_URL}/trips/by-route/${routeId}`, {
      headers,
      query: { date },
    });
  },
  listByDate: (date, guideId, headers = {}) => {
    return get("operations", `${BASE_URL}/trips`, {
      headers,
      query: { date, guideId },
    });
  },
  listAttendanceByRoute: (routeId, from, to, headers = {}) => {
    return get("operations", `${BASE_URL}/trips/by-route/${routeId}/attendance`, {
      headers,
      query: { from, to },
    });
  },
  startTrip: (tripId, data, headers = {}) => {
    return post("operations", `${BASE_URL}/trips/${tripId}/start`, data, { headers });
  },
  finishTrip: (tripId, data, headers = {}) => {
    return post("operations", `${BASE_URL}/trips/${tripId}/finish`, data, { headers });
  },

  // Trip event methods
  listEvents: (tripId, headers = {}) => {
    return get("operations", `${BASE_URL}/trips/${tripId}/events`, { headers });
  },
  registerEvent: (tripId, data, headers = {}) => {
    return post("operations", `${BASE_URL}/trips/${tripId}/events`, data, { headers });
  },

  // Trip student attendance methods
  initializeRoster: (tripId, data, headers = {}) => {
    return post("operations", `${BASE_URL}/trips/${tripId}/attendance/roster`, data, {
      headers,
    });
  },
  listStudentAttendance: (tripId, headers = {}) => {
    return get("operations", `${BASE_URL}/trips/${tripId}/attendance`, { headers });
  },
  registerOrUpdateAttendance: (tripId, studentId, data, headers = {}) => {
    return put("operations", `${BASE_URL}/trips/${tripId}/attendance/${studentId}`, data, {
      headers,
    });
  },
};

module.exports = OperationsRepository;
