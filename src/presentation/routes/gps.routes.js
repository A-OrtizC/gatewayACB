const express = require("express");
const {
  validateJsonBody,
  validateTrackingId,
  validateIdempotencyKey,
  validatePositionsQuery,
} = require("../middlewares/validation");

function createTrackingSessionsRouter(controller) {
  const router = express.Router();

  router.post(
    "/",
    validateIdempotencyKey,
    validateJsonBody,
    controller.createTrackingSession
  );
  router.get(
    "/:trackingId/positions",
    validateTrackingId,
    validatePositionsQuery,
    controller.listTrackingSessionPositions
  );
  router.get(
    "/:trackingId/latest-position",
    validateTrackingId,
    controller.getLatestPosition
  );
  router.get(
    "/:trackingId/control",
    validateTrackingId,
    controller.getTrackingSessionControl
  );
  router.post(
    "/:trackingId/observations",
    validateTrackingId,
    validateJsonBody,
    controller.registerObservation
  );
  router.patch(
    "/:trackingId/disable",
    validateTrackingId,
    controller.disableTrackingSession
  );
  router.post(
    "/:trackingId/finish",
    validateTrackingId,
    controller.finishTrackingSession
  );
  router.get("/:trackingId", validateTrackingId, controller.getTrackingSession);

  return router;
}

module.exports = createTrackingSessionsRouter;
