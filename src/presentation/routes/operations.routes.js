const express = require("express");
const { validateNumericParam } = require("../middlewares/validation");

function createOperationsRouter(controller) {
  const router = express.Router();
  for (const name of [
    "tripId",
    "routeId",
    "tripGuideId",
    "studentId",
    "guideId",
    "cycleId",
    "majorFaultId",
    "minorFaultId",
  ]) {
    router.param(name, validateNumericParam(name));
  }

  // ---- Viajes ----
  router.post("/trips", controller.createTrip);
  router.get("/trips/by-route/:routeId", controller.getTripByRouteAndDate);
  router.get("/trips/:tripId", controller.getTrip);
  router.get("/trips/:tripId/guides", controller.listTripGuides);
  router.put(
    "/trips/:tripId/guides/:tripGuideId/replacement",
    controller.replaceGuide
  );
  router.post("/trips/:tripId/start", controller.startTrip);
  router.post("/trips/:tripId/finish", controller.finishTrip);

  // ---- Eventos del viaje ----
  router.get("/trips/:tripId/events", controller.listTripEvents);
  router.post("/trips/:tripId/events", controller.registerTripEvent);

  // ---- Asistencia de estudiantes ----
  router.post("/trips/:tripId/attendance/roster", controller.initializeRoster);
  router.get("/trips/:tripId/attendance", controller.listStudentAttendance);
  router.put(
    "/trips/:tripId/attendance/:studentId",
    controller.registerOrUpdateAttendance
  );

  // ---- Faltas de guias ----
  router.get("/guide-faults/guides/:guideId/cycles", controller.listCyclesForGuide);
  router.get("/guide-faults/cycles/:cycleId/minor", controller.listMinorFaults);
  router.get("/guide-faults/major/:majorFaultId", controller.getMajorFault);
  router.put(
    "/guide-faults/minor/:minorFaultId/notified",
    controller.markMinorFaultNotified
  );
  router.put(
    "/guide-faults/major/:majorFaultId/notified",
    controller.markMajorFaultNotified
  );
  router.put(
    "/guide-faults/major/:majorFaultId/minuted",
    controller.markMajorFaultMinuted
  );

  // ---- Check-ins de guias ----
  router.get(
    "/trip-guides/:tripGuideId/check-ins",
    controller.listGuideCheckInAttempts
  );
  router.post(
    "/internal/trip-guides/:tripGuideId/check-ins",
    controller.recordGeolocationResult
  );

  return router;
}

module.exports = createOperationsRouter;
