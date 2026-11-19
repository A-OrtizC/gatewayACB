const express = require("express");
const {
  validateJsonBody,
  validateNumericParam,
  validateQuery,
} = require("../middlewares/validation");

const id = validateNumericParam("id");

function createAdminRouter(controller) {
  const router = express.Router();

  // Routes
  router.get("/routes", validateQuery, controller.listRoutes);
  router.post("/routes", validateJsonBody, controller.createRoute);
  router.get("/routes/:id/overview", id, controller.getRouteOverview);
  router.get(
    "/routes/:routeId/attendance",
    validateNumericParam("routeId"),
    validateQuery,
    controller.getRouteAttendanceHistory
  );
  router.get("/routes/:routeId/meeting-points", validateNumericParam("routeId"), controller.listMeetingPointsForRoute);
  router.post(
    "/routes/:routeId/meeting-points",
    validateNumericParam("routeId"),
    validateJsonBody,
    controller.createMeetingPoint
  );
  router.get(
    "/routes/:routeId/students",
    validateNumericParam("routeId"),
    controller.listStudentsByRoute
  );
  router.post(
    "/routes/:routeId/students",
    validateNumericParam("routeId"),
    validateJsonBody,
    controller.assignStudentToRoute
  );
  router.put("/routes/:id/guides", id, validateJsonBody, controller.assignGuidesToRoute);
  router.get("/routes/:id", id, controller.getRoute);
  router.put("/routes/:id", id, validateJsonBody, controller.updateRoute);
  router.delete("/routes/:id", id, controller.deactivateRoute);

  // Meeting points
  router.get("/meeting-points/:id/students", id, validateQuery, controller.getRosterAtMeetingPoint);
  router.get("/meeting-points/:id", id, controller.getMeetingPoint);
  router.put("/meeting-points/:id", id, validateJsonBody, controller.updateMeetingPoint);
  router.delete("/meeting-points/:id", id, controller.deleteMeetingPoint);

  // Route students. Se publican bajo route-students para no chocar con
  // /admin/students, que pertenece al servicio admin_users.
  router.get("/route-students/:id/meeting-points", id, controller.getStudentMeetingPoints);
  router.put(
    "/route-students/:id/meeting-points",
    id,
    validateJsonBody,
    controller.assignStudentMeetingPoints
  );
  router.get("/route-students/:id", id, controller.getRouteStudent);
  router.put("/route-students/:id", id, validateJsonBody, controller.updateRouteStudent);
  router.delete("/route-students/:id", id, controller.deactivateRouteStudent);

  // Schools
  router.get("/schools", validateQuery, controller.listSchools);
  router.post("/schools", validateJsonBody, controller.createSchool);
  router.get("/schools/:id", id, controller.getSchool);
  router.put("/schools/:id", id, validateJsonBody, controller.updateSchool);
  router.delete("/schools/:id", id, controller.deactivateSchool);

  return router;
}

module.exports = createAdminRouter;
