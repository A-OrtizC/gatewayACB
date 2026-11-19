const express = require("express");
const pathsRepository = require("./data/repositories/pathsRepository");
const authRepository = require("./data/repositories/authRepository");
const usersRepository = require("./data/repositories/usersRepository");
const routesRepository = require("./data/repositories/routesRepository");
const operationsRepository = require("./data/repositories/operationsRepository");
const gpsRepository = require("./data/repositories/gpsRepository");
const createPathsService = require("./logic/services/paths.service");
const createAuthService = require("./logic/services/auth.service");
const createUsersService = require("./logic/services/users.service");
const createAdminRoutesService = require("./logic/services/adminRoutes.service");
const createOperationsService = require("./logic/services/operations.service");
const createGpsService = require("./logic/services/gps.service");
const createPathsController = require("./presentation/controllers/paths.controller");
const createAuthController = require("./presentation/controllers/auth.controller");
const createUsersController = require("./presentation/controllers/users.controller");
const createAdminRoutesController = require("./presentation/controllers/adminRoutes.controller");
const createOperationsController = require("./presentation/controllers/operations.controller");
const createGpsController = require("./presentation/controllers/gps.controller");
const {
  createPathsRouter,
  createImportsRouter,
  createMeetingPointsRouter,
  createStatusRouter
} = require("./presentation/routes/paths.routes");
const createAuthRouter = require("./presentation/routes/auth.routes");
const {
  createGuidesRouter,
  createStudentsRouter,
  createSearchRouter
} = require("./presentation/routes/users.routes");
const createAdminRoutesRouter = require("./presentation/routes/adminRoutes.routes");
const createOperationsRouter = require("./presentation/routes/operations.routes");
const createGpsRouter = require("./presentation/routes/gps.routes");
const createUnavailableRouter = require("./presentation/routes/unavailable.routes");
const requestContext = require("./presentation/middlewares/requestContext");
const errorHandler = require("./presentation/middlewares/errorHandler");
const notFoundHandler = require("./presentation/middlewares/notFoundHandler");

function createApp({
  pathsService,
  authService,
  usersService,
  adminRoutesService,
  operationsService,
  gpsService
} = {}) {
  const app = express();

  const paths = pathsService || createPathsService(pathsRepository);
  const auth = createAuthController(authService || createAuthService(authRepository));
  const users = createUsersController(usersService || createUsersService(usersRepository));
  const adminRoutes = createAdminRoutesController(
    adminRoutesService || createAdminRoutesService(routesRepository)
  );
  const operations = createOperationsController(
    operationsService || createOperationsService(operationsRepository)
  );
  const gps = createGpsController(gpsService || createGpsService(gpsRepository));

  const pathsController = createPathsController(paths);
  const authRouter = createAuthRouter(auth);
  const guidesRouter = createGuidesRouter(users);
  const studentsRouter = createStudentsRouter(users);
  const searchRouter = createSearchRouter(users);

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

  // ---- Contrato base de autenticacion y admin_users ----
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/guides", guidesRouter);
  app.use("/api/v1/students", studentsRouter);
  app.use("/api/v1/search", searchRouter);

  // ---- Alias administrativos usados por presentationACB ----
  // Nginx reescribe /api/admin/* a /api/v1/admin/*.
  app.use("/api/v1/admin/auth", authRouter);
  app.use("/api/v1/admin/guides", guidesRouter);
  app.use("/api/v1/admin/students", studentsRouter);
  app.use("/api/v1/admin/search", searchRouter);

  // Endpoints sin contrato backend: se responden como 501, no como 404.
  app.use("/api/v1", createUnavailableRouter());

  // ---- admin_routes + admin_operations ----
  app.use("/api/v1/admin", createAdminRoutesRouter(adminRoutes));
  app.use("/api/v1/admin", createOperationsRouter(operations));

  // ---- Geolocalizacion (solo paths de Python) ----
  app.use("/api/v1/routes", createPathsRouter(pathsController));
  app.use("/api/v1/meeting-points", createMeetingPointsRouter(pathsController));
  app.use("/api/v1/imports", createImportsRouter(pathsController));
  app.use("/api/v1/status", createStatusRouter(pathsController));

  // ---- Tracking GPS (solo el componente Go) ----
  app.use("/api/v1/tracking-sessions", createGpsRouter(gps));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
