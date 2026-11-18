const express = require("express");
const {
  validateJsonBody,
  validateJsonArray,
  validateNumericParam,
} = require("../middlewares/validation");

const tripId = validateNumericParam("tripId", "El identificador de viaje no es válido.");
const tripGuideId = validateNumericParam(
  "tripGuideId",
  "El identificador de guía de viaje no es válido."
);
const studentId = validateNumericParam(
  "studentId",
  "El identificador de estudiante no es válido."
);

function createTripsRouter(controller) {
  const router = express.Router();

  router.get("/by-route/:routeId", validateNumericParam("routeId"), controller.getTripByRouteAndDate);
  router.post("/", validateJsonBody, controller.createTrip);
  router.get("/:tripId/overview", tripId, controller.getTripOverview);
  router.get("/:tripId/guides", tripId, controller.listTripGuides);
  router.put(
    "/:tripId/guides/:tripGuideId/replacement",
    tripId,
    tripGuideId,
    validateJsonBody,
    controller.replaceTripGuide
  );
  router.post("/:tripId/start", tripId, controller.startTrip);
  router.post("/:tripId/finish", tripId, controller.finishTrip);
  router.get("/:tripId/events", tripId, controller.listTripEvents);
  router.post("/:tripId/events", tripId, validateJsonBody, controller.registerTripEvent);
  router.post(
    "/:tripId/attendance/roster",
    tripId,
    validateJsonArray,
    controller.initializeRoster
  );
  router.get("/:tripId/attendance", tripId, controller.listStudentAttendance);
  router.put(
    "/:tripId/attendance/:studentId",
    tripId,
    studentId,
    validateJsonBody,
    controller.registerOrUpdateAttendance
  );
  router.get("/:tripId", tripId, controller.getTrip);

  return router;
}

function createTripGuidesRouter(controller) {
  const router = express.Router();
  router.get("/:tripGuideId/check-ins", tripGuideId, controller.listGuideCheckIns);
  return router;
}

const guideId = validateNumericParam("guideId");
const cycleId = validateNumericParam("cycleId");
const majorFaultId = validateNumericParam("majorFaultId");
const minorFaultId = validateNumericParam("minorFaultId");

function createGuideFaultsRouter(controller) {
  const router = express.Router();

  router.get("/guides/:guideId/cycles", guideId, controller.listGuideFaultCycles);
  router.get("/cycles/:cycleId/minor", cycleId, controller.listMinorFaults);
  router.get("/major/:majorFaultId", majorFaultId, controller.getMajorFault);
  router.put(
    "/minor/:minorFaultId/notified",
    minorFaultId,
    controller.markMinorFaultNotified
  );
  router.put(
    "/major/:majorFaultId/notified",
    majorFaultId,
    controller.markMajorFaultNotified
  );
  router.put(
    "/major/:majorFaultId/minuted",
    majorFaultId,
    controller.markMajorFaultMinuted
  );

  return router;
}

module.exports = {
  createTripsRouter,
  createTripGuidesRouter,
  createGuideFaultsRouter,
};
