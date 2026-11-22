const express = require("express");
const {
  validateJsonBody,
  validateTrackingId,
  validateIdempotencyKey,
  validatePositionsQuery,
} = require("../middlewares/validation");
const {
  requireTrackingAuth,
  requireGuide,
} = require("../middlewares/jwtAuth");

function createTrackingSessionsRouter(controller) {
  const router = express.Router();

  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  router.post(
    "/",
    requireTrackingAuth,
    requireGuide,
    validateIdempotencyKey,
    validateJsonBody,
    controller.createTrackingSession
  );
  router.get(
    "/:trackingId/positions",
    requireTrackingAuth,
    validateTrackingId,
    validatePositionsQuery,
    controller.listTrackingSessionPositions
  );
  router.get(
    "/:trackingId/latest-position",
    requireTrackingAuth,
    validateTrackingId,
    controller.getLatestPosition
  );
  router.get(
    "/:trackingId/control",
    requireTrackingAuth,
    validateTrackingId,
    controller.getTrackingSessionControl
  );
  // The observation credential is the only authentication for this route.
  router.post(
    "/:trackingId/observations",
    validateTrackingId,
    validateJsonBody,
    controller.registerObservation
  );
  router.patch(
    "/:trackingId/disable",
    requireTrackingAuth,
    validateTrackingId,
    controller.disableTrackingSession
  );
  router.post(
    "/:trackingId/finish",
    requireTrackingAuth,
    validateTrackingId,
    controller.finishTrackingSession
  );
  router.get(
    "/:trackingId",
    requireTrackingAuth,
    validateTrackingId,
    controller.getTrackingSession
  );

  return router;
}

module.exports = createTrackingSessionsRouter;
