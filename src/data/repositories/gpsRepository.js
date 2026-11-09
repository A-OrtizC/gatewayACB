const { get, post, patch, HttpError } = require("../clients/httpClient");

const BASEURL = "/api/v1";

// El GPS exige una credencial interna de servicio para control y lectura.
// Debe coincidir con GPS_GATEWAY_INTERNAL_TOKEN del componente Go.
function internalHeaders(headers = {}) {
  const token = process.env.GPS_INTERNAL_TOKEN;
  if (!token) {
    throw new HttpError(
      'GPS_INTERNAL_TOKEN no esta configurado para llamar al servicio GPS.',
      undefined,
      "gps",
      null,
      { code: "SERVICE_NOT_CONFIGURED" }
    );
  }
  return { ...headers, Authorization: `Bearer ${token}` };
}

const GpsRepository = {
  findTrackingSessions: async (tracking_id, headers = {}) => {
    return get("gps", `${BASEURL}/tracking-sessions/${tracking_id}`, {
      headers: internalHeaders(headers),
    });
  },

  // Conserva el Bearer propio de la sesion; no lo sustituye por el interno.
  createTrackingSessionObservation: (tracking_id, data, headers = {}) => {
    return post("gps", `${BASEURL}/tracking-sessions/${tracking_id}/observations`, data, { headers });
  },

  findTrackingSessionPositions: async (tracking_id, { after_sequence = null, limit = 10 } = {}, headers = {}) => {
    const query = {};
    if (after_sequence !== null) {
      query.after_sequence = after_sequence;
    }
    query.limit = limit;

    return get("gps", `${BASEURL}/tracking-sessions/${tracking_id}/positions`, {
      headers: internalHeaders(headers),
      query,
    });
  },

  createTrackingSession: async (data, idempotencyKey = null, headers = {}) => {
    const headersWithIdempotency = idempotencyKey
      ? { ...headers, "Idempotency-Key": idempotencyKey }
      : headers;
    return post("gps", `${BASEURL}/tracking-sessions`, data, {
      headers: internalHeaders(headersWithIdempotency),
    });
  },

  findTrackingSessionControl: async (tracking_id, headers = {}) => {
    return get("gps", `${BASEURL}/tracking-sessions/${tracking_id}/control`, {
      headers: internalHeaders(headers),
    });
  },

  disableTrackingSession: async (tracking_id, headers = {}) => {
    return patch("gps", `${BASEURL}/tracking-sessions/${tracking_id}/disable`, undefined, {
      headers: internalHeaders(headers),
    });
  },
};

module.exports = GpsRepository;
