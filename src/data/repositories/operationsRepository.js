const { get, post, put, patch, del } = require("../clients/httpClient");

BASE_URL = "/api/v1";

const OperationsRepository = {
  //Guide checkin audit methods
  listGuideCheckInAttempts: (tripGuideId, headers = {}) => {
    return get("operations", `${BASE_URL}/trip-guides/${tripGuideId}/check-ins`, { headers });
  },

  //Guide Checkin methods
  recordGeolocationResult: (tripGuideId, data, headers = {}) => {
    return post("operations", `${BASE_URL}/internal/trip-guides/${tripGuideId}/check-ins`, data, { headers });
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
    return put("operations", `${BASE_URL}/guide-faults/minor/${minorFaultId}/notified`, { headers});
  },
  markMajorFaultNotified: (majorFaultId, headers = {}) => {
    return put("operations", `${BASE_URL}/guide-faults/major/${majorFaultId}/notified`, { headers });
  },
  markMajorFaultMinuted: (majorFaultId, headers = {}) => {
    return put("operations", `${BASE_URL}/guide-faults/major/${majorFaultId}/minuted`, { headers });
  },

  // Trip methods
  

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

