const express = require("express");
const pathsRepository = require("./data/repositories/pathsRepository");
const authRepository = require("./data/repositories/authRepository");
const usersRepository = require("./data/repositories/usersRepository");
const createPathsService = require("./logic/services/paths.service");
const createAuthService = require("./logic/services/auth.service");
const createUsersService = require("./logic/services/users.service");
const createPathsController = require("./presentation/controllers/paths.controller");
const createAuthController = require("./presentation/controllers/auth.controller");
const createUsersController = require("./presentation/controllers/users.controller");
const createPathsRouter = require("./presentation/routes/paths.routes");
const createAuthRouter = require("./presentation/routes/auth.routes");
const {
  createGuidesRouter,
  createStudentsRouter,
  createSearchRouter
} = require("./presentation/routes/users.routes");
const requestContext = require("./presentation/middlewares/requestContext");
const errorHandler = require("./presentation/middlewares/errorHandler");
const notFoundHandler = require("./presentation/middlewares/notFoundHandler");

function createApp({ pathsService, authService, usersService } = {}) {
  const app = express();
  const service = pathsService || createPathsService(pathsRepository);
  const controller = createPathsController(service);
  const auth = createAuthController(authService || createAuthService(authRepository));
  const users = createUsersController(usersService || createUsersService(usersRepository));

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

  app.use("/api/v1/auth", createAuthRouter(auth));
  app.use("/api/v1/guides", createGuidesRouter(users));
  app.use("/api/v1/students", createStudentsRouter(users));
  app.use("/api/v1/search", createSearchRouter(users));
  app.use("/api/v1/routes", createPathsRouter(controller));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;