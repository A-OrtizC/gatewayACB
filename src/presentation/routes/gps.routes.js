const express = require("express");

function createGpsRouter(controller) {
  const router = express.Router();

  // Tracking tecnico: exclusivamente el componente Go (acb_gps_lo).
  // El tracking de acb_path_lo (Python) es legado y no se enruta aqui.
  router.post("/", controller.createSession);
  router.get("/:trackingId", controller.getSession);
  router.post("/:trackingId/observations", controller.createObservation);
  router.get("/:trackingId/positions", controller.listPositions);
  router.get("/:trackingId/latest-position", controller.getLatestPosition);
  router.get("/:trackingId/control", controller.getControl);
  router.post("/:trackingId/finish", controller.finishSession);
  router.patch("/:trackingId/disable", controller.disableSession);

  return router;
}

module.exports = createGpsRouter;
