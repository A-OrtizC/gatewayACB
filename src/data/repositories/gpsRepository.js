const { get, post, put, patch, del } = require("../clients/httpClient");


const GpsRepository = {

  createNotify: async (data, headers ={}) => {
    return post('gps', '/api/v1/status/notify', data, { headers });
  },

  findTrackingSessions: (id, headers = {}) => {
    
    return get("gps", `/api/v1/tracking-sessions/${id}`, { headers });
  },
  createTrackingSessionObservation: (data, headers = {}) => {
    return post("gps", `/api/v1/tracking-sessions/${id}/observations`, data, { headers });
  }, 
  findTrackingSessionPositions: async (tracking_id, { after_sequence = null, limit = 10 }, headers = {}) => {
    
    const params = {};
    params.after_sequence = after_sequence;
    params.limit = limit;
    
    return get("gps", `/api/v1/tracking-sessions/${tracking_id}/positions`, { headers, params });
  },

  createTrackingSession: async (data, idempotencyKey = null, headers = {}) => {
    const headersWithIdempotency = idempotencyKey ? { ...headers, 'Idempotency-Key': idempotencyKey } : headers;
    return post("gps", `/api/v1/tracking-sessions`, data, { headers: headersWithIdempotency });
  },

  findTrackingSessionControl: async (tracking_id, headers = {}) => {
    return get("gps", `/api/v1/tracking-sessions/${tracking_id}/control`, { headers });
  },

  disableTrackingSession: async (tracking_id, headers = {}) => {
    return patch("gps", `/api/v1/tracking-sessions/${tracking_id}/disable`, { headers });
  },
};

module.exports = GpsRepository;

