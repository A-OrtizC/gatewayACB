const express = require("express");
const {
  validateJsonBody,
  validateQuery,
  validateRouteId
} = require("../middlewares/validation");

function createPathsRouter(controller) {
  const router = express.Router();

  router.get("/", validateQuery, controller.findAll);
  router.get("/search", validateQuery, controller.search);
  router.get("/:id/overview", validateRouteId, controller.getOverview);
  router.get("/:id/first-meeting-point", validateRouteId, controller.getFirstMeetingPoint);
  router.get("/:id/endpoints", validateRouteId, controller.getEndpoints);
  router.get("/:id", validateRouteId, controller.findById);
  router.post("/imports/kmz", validateJsonBody, controller.importKmz);

  return router;
}

module.exports = createPathsRouter;
