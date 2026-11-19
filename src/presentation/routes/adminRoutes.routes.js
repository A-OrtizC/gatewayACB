const express = require("express");
const { validateNumericParam } = require("../middlewares/validation");

function createAdminRoutesRouter(controller) {
  const router = express.Router();
  router.param("id", validateNumericParam("id"));

  // ---- Colegios ----
  router.get("/schools", controller.listSchools);
  router.post("/schools", controller.createSchool);
  router.get("/schools/:id", controller.getSchool);
  router.put("/schools/:id", controller.updateSchool);
  router.delete("/schools/:id", controller.deleteSchool);

  // ---- Rutas administrativas ----
  router.get("/routes", controller.listRoutes);
  router.post("/routes", controller.createRoute);
  router.get("/routes/:id", controller.getRoute);
  router.put("/routes/:id", controller.updateRoute);
  router.delete("/routes/:id", controller.deleteRoute);
  router.put("/routes/:id/guides", controller.assignGuides);
  router.get("/routes/:id/students", controller.listRouteStudents);
  router.post("/routes/:id/students", controller.assignStudentToRoute);
  router.get("/routes/:id/meeting-points", controller.listRouteMeetingPoints);
  router.post("/routes/:id/meeting-points", controller.createRouteMeetingPoint);

  // ---- Puntos de encuentro ----
  router.get("/meeting-points/:id", controller.getMeetingPoint);
  router.put("/meeting-points/:id", controller.updateMeetingPoint);
  router.delete("/meeting-points/:id", controller.deleteMeetingPoint);
  router.get("/meeting-points/:id/students", controller.getRosterAtMeetingPoint);

  // ---- Matricula de estudiantes en rutas ----
  // Se publica bajo route-students para no chocar con /admin/students,
  // que pertenece a admin_users.
  router.get("/route-students/:id", controller.getRouteStudent);
  router.put("/route-students/:id", controller.updateRouteStudent);
  router.delete("/route-students/:id", controller.deleteRouteStudent);
  router.get("/route-students/:id/meeting-points", controller.getStudentMeetingPoints);
  router.put(
    "/route-students/:id/meeting-points",
    controller.assignStudentMeetingPoints
  );

  return router;
}

module.exports = createAdminRoutesRouter;
