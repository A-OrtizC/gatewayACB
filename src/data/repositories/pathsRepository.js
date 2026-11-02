const { get, post, put, patch, del } = require("../clients/httpClient");


const PathsRepository = {
  findAllRoutes: (query = {}, headers = {}) => {

    return get("paths", "/routes", { headers, query });
  },
  
  searchRoutes: (query = {}, headers = {}) => {

    return get("paths", "/routes/search", { headers, query });
  },

  findById: (id, headers = {}) => {

    
    return get("paths", `/routes/${id}`, { headers });
  },

  findFirstMettingPoint: (id, headers = {}) => {

    return get("paths", `/routes/${id}/first-metting-point`, { headers });
  },

  findEndPoints: (id, headers = {}) => {

    return get("paths", `/routes/${id}/endpoints`, { headers });
  
  },

  createImportKMZ: (data, headers = {}) => {
    return post("paths", "/imports/kmz", data, { headers });
  },
};

module.exports = PathsRepository;
