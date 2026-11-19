const express = require("express");

// Endpoints que presentationACB espera pero que ningun backend implementa
// todavia. Se responden de forma explicita para que el cliente no confunda
// la ausencia de contrato con una ruta inexistente del gateway.
function unavailable(req, res) {
  res.status(501).json({
    error: {
      code: "FEATURE_UNAVAILABLE",
      message:
        "Esta funcion no tiene contrato en los microservicios actuales. " +
        "El gateway no inventa datos ni operaciones.",
      correlationId: req.correlationId,
    },
  });
}

function createUnavailableRouter() {
  const router = express.Router();

  router.get("/admin/zones", unavailable);

  router.get("/admin/leaders", unavailable);
  router.post("/admin/leaders", unavailable);
  router.get("/admin/leaders/:id", unavailable);
  router.put("/admin/leaders/:id", unavailable);
  router.delete("/admin/leaders/:id", unavailable);

  router.get("/admin/arrivals", unavailable);
  router.patch("/admin/arrivals/:id", unavailable);

  router.get("/admin/routes/search", unavailable);
  router.post("/admin/routes/:code/submit", unavailable);
  router.post("/admin/routes/:code/approve", unavailable);
  router.post("/admin/routes/:code/reject", unavailable);

  router.post("/admin/trips/:id/executors", unavailable);

  router.delete("/admin/students/:id", unavailable);
  router.delete("/admin/guides/:id", unavailable);

  router.get("/status", unavailable);
  router.get("/positions/latest", unavailable);

  return router;
}

module.exports = createUnavailableRouter;
