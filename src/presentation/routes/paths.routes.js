const express = require("express");
const {
  validateQuery,
  validateRouteId,
  validateMultipartBody
} = require("../middlewares/validation");

function createPathsRouter(controller) {
  const router = express.Router();

  router.get("/", validateQuery, controller.findAll);
  router.get("/search", validateQuery, controller.search);
  router.get("/:id/overview", validateRouteId, controller.getOverview);
  router.get("/:id/first-meeting-point", validateRouteId, controller.getFirstMeetingPoint);
  router.get("/:id/endpoints", validateRouteId, controller.getEndpoints);
  router.post(
    "/:id/first-meeting-point/validate",
    validateRouteId,
    controller.validateFirstMeetingPoint
  );
  router.get("/:id", validateRouteId, controller.findById);
  router.post(
    "/imports/kmz",
    express.raw({ type: "multipart/form-data", limit: 21 * 1024 * 1024 }),
    validateMultipartBody,
    controller.importKmz
  );

  return router;
}

function createImportsRouter(controller) {
  const router = express.Router();
  router.post(
    "/kmz",
    express.raw({ type: "multipart/form-data", limit: 21 * 1024 * 1024 }),
    validateMultipartBody,
    controller.importKmz
  );
  return router;
}

function createMeetingPointsRouter(controller) {
  const router = express.Router();
  router.get("/", controller.listMeetingPoints);
  return router;
}

function createStatusRouter(controller) {
  const router = express.Router();
  router.post("/notify", controller.notifyStatus);
  return router;
}

module.exports = {
  createPathsRouter,
  createImportsRouter,
  createMeetingPointsRouter,
  createStatusRouter
};
