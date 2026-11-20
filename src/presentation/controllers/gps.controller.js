const {
  buildRequestContext,
  sendResult,
  sendUpstreamResult,
} = require("../utils/requestContext");
const { HttpError } = require("../../data/clients/httpClient");

function createGpsController(service) {
  return {
    // Conserva 201 (nueva) y 200 (replay) del componente Go.
    async createTrackingSession(req, res) {
      const context = buildRequestContext(req);
      const policyId = process.env.GPS_POLICY_ID;
      if (!policyId) {
        throw new HttpError(
          "GPS_POLICY_ID no está configurado para crear sesiones de tracking.",
          503,
          "gps",
          null,
          { code: "SERVICE_NOT_CONFIGURED" }
        );
      }
      const payload = {
        ...req.body,
        // The authenticated guide is authoritative; never trust body.guide_id.
        guide_id: String(req.auth.id),
        // The policy is a server-side deployment decision.
        policy_id: policyId,
      };
      const result = await service.createTrackingSession(
        payload,
        req.get("idempotency-key"),
        context.headers,
        context.correlationId
      );
      sendUpstreamResult(res, result, 201);
    },

    async getTrackingSession(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getTrackingSession(
        req.params.trackingId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async getTrackingSessionControl(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getTrackingSessionControl(
        req.params.trackingId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async listTrackingSessionPositions(req, res) {
      const context = buildRequestContext(req);
      const result = await service.listTrackingSessionPositions(
        req.params.trackingId,
        {
          after_sequence:
            req.query.after_sequence !== undefined
              ? Number(req.query.after_sequence)
              : null,
          limit:
            req.query.limit !== undefined ? Number(req.query.limit) : null,
        },
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    // Go responde 204 sin cuerpo cuando aun no hay observaciones.
    async getLatestPosition(req, res) {
      const context = buildRequestContext(req);
      const result = await service.getLatestPosition(
        req.params.trackingId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    // Conserva 201 (nueva) y 200 (replay) del componente Go. El Bearer de la
    // sesion se reenvia sin sustituirlo por el token interno.
    async registerObservation(req, res) {
      const context = buildRequestContext(req);
      const result = await service.registerObservation(
        req.params.trackingId,
        req.body,
        context.headers,
        context.correlationId
      );
      sendUpstreamResult(res, result, 201);
    },

    async disableTrackingSession(req, res) {
      const context = buildRequestContext(req);
      const result = await service.disableTrackingSession(
        req.params.trackingId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },

    async finishTrackingSession(req, res) {
      const context = buildRequestContext(req);
      const result = await service.finishTrackingSession(
        req.params.trackingId,
        context.headers,
        context.correlationId
      );
      sendResult(res, result);
    },
  };
}

module.exports = createGpsController;
