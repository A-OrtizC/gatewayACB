const { get, post, put, patch, del } = require("../clients/httpClient");

const BASE_URL = "/api/v1";

const PathsRepository = {
  findAllRoutes: (query = {}, headers = {}) => {

    return get("paths", `${BASE_URL}/routes`, { headers, query });
  },
  
  searchRoutes: (query = {}, headers = {}) => {

    return get("paths", `${BASE_URL}/routes/search`, { headers, query });
  },

  findById: (id, headers = {}) => {

    
    return get("paths", `${BASE_URL}/routes/${id}`, { headers });
  },

  findFirstMettingPoint: (id, headers = {}) => {

    return get("paths", `${BASE_URL}/routes/${id}/first-metting-point`, { headers });
  },

  findEndPoints: (id, headers = {}) => {

    return get("paths", `${BASE_URL}/routes/${id}/endpoints`, { headers });
  
  },

  createImportKMZ: (data, headers = {}) => {
    return post("paths", `${BASE_URL}/imports/kmz`, data, { headers });
  },

  notifyStatus: (data, headers = {}) => {
    return post("paths", `${BASE_URL}/status/notify`, data, { headers });
  },
};

module.exports = PathsRepository;
