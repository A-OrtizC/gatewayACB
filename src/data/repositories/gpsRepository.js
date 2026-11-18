const { get, post, patch, HttpError } = require("../clients/httpClient");

const BASEURL = "/api/v1";

// El GPS exige una credencial interna de servicio para control y lectura.
// Debe coincidir con GPS_GATEWAY_INTERNAL_TOKEN del componente Go.
function internalHeaders(headers = {}) {
  const token = process.env.GPS_INTERNAL_TOKEN;
  if (!token) {
    throw new HttpError(
      "GPS_INTERNAL_TOKEN no esta configurado para llamar al servicio GPS.",
      undefined,
      "gps",
      null,
      { code: "SERVICE_NOT_CONFIGURED" }
    );
  }
  return replaceHeader(headers, "Authorization", `Bearer ${token}`);
}

// Sustituye una cabecera sin dejar variantes con distinta capitalizacion, que
// fetch combinaria en un unico valor separado por comas.
function replaceHeader(headers, name, value) {
  const result = { ...headers };
  for (const existing of Object.keys(result)) {
    if (existing.toLowerCase() === name.toLowerCase()) {
      delete result[existing];
    }
  }
  result[name] = value;
  return result;
}

const GpsRepository = {
  findTrackingSessions: async (tracking_id, headers = {}) => {
    return get("gps", `${BASEURL}/tracking-sessions/${tracking_id}`, {
      headers: internalHeaders(headers),
    });
  },

  // Conserva el Bearer propio de la sesion; no lo sustituye por el interno.
  // Devuelve tambien el status para distinguir 201 (nueva) de 200 (replay).
  createTrackingSessionObservation: (tracking_id, data, headers = {}) => {
    return post("gps", `${BASEURL}/tracking-sessions/${tracking_id}/observations`, data, {
      headers,
      fullResponse: true,
    });
  },

  findTrackingSessionPositions: async (
    tracking_id,
    { after_sequence = null, limit = null } = {},
    headers = {}
  ) => {
    const query = {};
    if (after_sequence !== null) {
      query.after_sequence = after_sequence;
    }
    if (limit !== null) {
      query.limit = limit;
    }

    return get("gps", `${BASEURL}/tracking-sessions/${tracking_id}/positions`, {
      headers: internalHeaders(headers),
      query,
    });
  },

  // Devuelve tambien el status para distinguir 201 (nueva) de 200 (replay).
  createTrackingSession: async (data, idempotencyKey = null, headers = {}) => {
    const headersWithIdempotency = idempotencyKey
      ? replaceHeader(headers, "Idempotency-Key", idempotencyKey)
      : headers;
    return post("gps", `${BASEURL}/tracking-sessions`, data, {
      headers: internalHeaders(headersWithIdempotency),
      fullResponse: true,
    });
  },

  findTrackingSessionControl: async (tracking_id, headers = {}) => {
    return get("gps", `${BASEURL}/tracking-sessions/${tracking_id}/control`, {
      headers: internalHeaders(headers),
    });
  },

  findTrackingSessionLatestPosition: async (tracking_id, headers = {}) => {
    return get("gps", `${BASEURL}/tracking-sessions/${tracking_id}/latest-position`, {
      headers: internalHeaders(headers),
    });
  },

  finishTrackingSession: async (tracking_id, headers = {}) => {
    return post("gps", `${BASEURL}/tracking-sessions/${tracking_id}/finish`, undefined, {
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
