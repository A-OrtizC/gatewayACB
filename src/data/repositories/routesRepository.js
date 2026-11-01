const { get, post, put, patch, del } = require("../clients/httpClient");

const RoutesRepository = {
  // Ejemplo genérico - Reemplazar con endpoints reales
  findAllRoutes: (query = {}, headers = {}) => {

    return get("routes", "/routes", { headers, query });
  },
  
  searchRoutes: (query = {}, headers = {}) => {

    return get("routes", "/routes/search", { headers, query });
  },

  findById: (id, headers = {}) => {

    
    return get("routes", `/routes/${id}`, { headers });
  },

  findFirstMettingPoint: (id, headers = {}) => {

    return get("routes", `/routes/${id}/first-metting-point`, { headers });
  },

  findEndPoints: (id, headers = {}) => {

    return get("routes", `/routes/${id}/endpoints`, { headers });
  
  },

  createImportKMZ: (data, headers = {}) => {
    return post("routes", "/imports/kmz", data, { headers });
  },


};

module.exports = RoutesRepository;
