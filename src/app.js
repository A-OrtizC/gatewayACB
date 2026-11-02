const express = require("express");
const pathsRepository = require("./data/repositories/pathsRepository");
const createPathsService = require("./logic/services/paths.service");
const createPathsController = require("./presentation/controllers/paths.controller");
const createPathsRouter = require("./presentation/routes/paths.routes");
const requestContext = require("./presentation/middlewares/requestContext");
const errorHandler = require("./presentation/middlewares/errorHandler");
const notFoundHandler = require("./presentation/middlewares/notFoundHandler");

function createApp({ pathsService } = {}) {
  const app = express();
  const service = pathsService || createPathsService(pathsRepository);
  const controller = createPathsController(service);

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

  app.use("/api/v1/routes", createPathsRouter(controller));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;