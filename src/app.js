const express = require("express");
const routesRepository = require("./data/repositories/routesRepository");
const createRoutesService = require("./logic/services/routes.service");
const createRoutesController = require("./presentation/controllers/routes.controller");
const createRoutesRouter = require("./presentation/routes/routes.routes");
const requestContext = require("./presentation/middlewares/requestContext");
const errorHandler = require("./presentation/middlewares/errorHandler");
const notFoundHandler = require("./presentation/middlewares/notFoundHandler");

function createApp({ routesService } = {}) {
  const app = express();
  const service = routesService || createRoutesService(routesRepository);
  const controller = createRoutesController(service);

  app.use(requestContext);
  app.use(express.json({ limit: "1mb" }));

  if (process.env.NODE_ENV !== "production") {
    const docsRoutes = require("./presentation/routes/docs.routes");
    app.use("/", docsRoutes);
  }

  app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
      status: "UP",
      service: "api-gateway",
      message: "API Gateway funcionando correctamente"
    });
  });

  app.use("/api/v1/routes", createRoutesRouter(controller));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;