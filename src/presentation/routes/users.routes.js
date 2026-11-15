const express = require("express");

function createGuidesRouter(controller) {
  const router = express.Router();

  router.get("/", controller.listGuides);
  router.post("/", controller.createGuide);
  router.get("/:id", controller.getGuide);
  router.put("/:id", controller.updateGuide);

  return router;
}

function createStudentsRouter(controller) {
  const router = express.Router();

  router.get("/", controller.listStudents);
  router.post("/", controller.createStudent);
  router.get("/school/:schoolId", controller.listStudentsBySchool);
  router.post("/:id/guardians", controller.assignGuardian);
  router.get("/:id", controller.getStudent);
  router.put("/:id", controller.updateStudent);

  return router;
}

function createSearchRouter(controller) {
  const router = express.Router();

  router.get("/", controller.search);

  return router;
}

module.exports = { createGuidesRouter, createStudentsRouter, createSearchRouter };
