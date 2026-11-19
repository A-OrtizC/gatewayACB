const express = require("express");

const pathsRepository = require("./data/repositories/pathsRepository");
const authRepository = require("./data/repositories/authRepository");
const usersRepository = require("./data/repositories/usersRepository");
const operationsRepository = require("./data/repositories/operationsRepository");
const routesRepository = require("./data/repositories/routesRepository");
const gpsRepository = require("./data/repositories/gpsRepository");

const createPathsService = require("./logic/services/paths.service");
const createAuthService = require("./logic/services/auth.service");
const createUsersService = require("./logic/services/users.service");
const createOperationsService = require("./logic/services/operations.service");
const createRoutesService = require("./logic/services/routes.service");
const createGpsService = require("./logic/services/gps.service");
const createTripsOrchestrator = require("./logic/orchestrators/trips.orchestrator");
const createRoutesOrchestrator = require("./logic/orchestrators/routes.orchestrator");
const createStudentsOrchestrator = require("./logic/orchestrators/students.orchestrator");
const createAttendanceOrchestrator = require("./logic/orchestrators/attendance.orchestrator");

const createPathsController = require("./presentation/controllers/paths.controller");
const createAuthController = require("./presentation/controllers/auth.controller");
const createUsersController = require("./presentation/controllers/users.controller");
const createOperationsController = require("./presentation/controllers/operations.controller");
const createRoutesController = require("./presentation/controllers/adminRoutes.controller");
const createGpsController = require("./presentation/controllers/gps.controller");

const {
  createPathsRouter,
  createImportsRouter,
  createMeetingPointsRouter,
  createStatusRouter,
} = require("./presentation/routes/paths.routes");
const createAuthRouter = require("./presentation/routes/auth.routes");
const {
  createGuidesRouter,
  createStudentsRouter,
  createSearchRouter,
} = require("./presentation/routes/users.routes");
const {
  createTripsRouter,
  createTripGuidesRouter,
  createGuideFaultsRouter,
} = require("./presentation/routes/operations.routes");
const createAdminRouter = require("./presentation/routes/admin.routes");
const createTrackingSessionsRouter = require("./presentation/routes/gps.routes");
const createUnavailableRouter = require("./presentation/routes/unavailable.routes");

const requestContext = require("./presentation/middlewares/requestContext");
const errorHandler = require("./presentation/middlewares/errorHandler");
const notFoundHandler = require("./presentation/middlewares/notFoundHandler");

function createApp({
  pathsService,
  authService,
  usersService,
  operationsService,
  routesService,
  gpsService,
  tripsOrchestrator,
  routesOrchestrator,
  studentsOrchestrator,
  attendanceOrchestrator,
} = {}) {
  const app = express();

  const paths = pathsService || createPathsService(pathsRepository);
  const operations =
    operationsService || createOperationsService(operationsRepository);
  const routes = routesService || createRoutesService(routesRepository);
  const users = usersService || createUsersService(usersRepository);
  const gps = gpsService || createGpsService(gpsRepository);

  const trips = {
    ...createTripsOrchestrator(operations),
    ...(tripsOrchestrator || {}),
  };
  const routesOverview = {
    ...createRoutesOrchestrator(routes),
    ...(routesOrchestrator || {}),
  };
  const students = {
    ...createStudentsOrchestrator({ usersService: users, routesService: routes }),
    ...(studentsOrchestrator || {}),
  };
  const attendance = {
    ...createAttendanceOrchestrator(operations),
    ...(attendanceOrchestrator || {}),
  };

  const pathsController = createPathsController(paths);
  const authController = createAuthController(
    authService || createAuthService(authRepository)
  );
  const usersController = createUsersController(users);
  const operationsController = createOperationsController(
    operations,
    trips,
    attendance
  );
  const routesController = createRoutesController(
    routes,
    routesOverview,
    students,
    attendance
  );
  const gpsController = createGpsController(gps);

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
      message: "API Gateway funcionando correctamente",
    });
  });

  // ---- Contrato base de autenticacion y admin_users ----
  app.use("/api/v1/auth", createAuthRouter(authController));
  app.use("/api/v1/guides", createGuidesRouter(usersController));
  app.use("/api/v1/students", createStudentsRouter(usersController));
  app.use("/api/v1/search", createSearchRouter(usersController));

  // ---- Alias administrativos usados por presentationACB ----
  // Nginx reescribe /api/admin/* a /api/v1/admin/*.
  app.use("/api/v1/admin/auth", createAuthRouter(authController));
  app.use("/api/v1/admin/guides", createGuidesRouter(usersController));
  app.use("/api/v1/admin/students", createStudentsRouter(usersController));
  app.use("/api/v1/admin/search", createSearchRouter(usersController));

  // Endpoints sin contrato backend: se responden como 501, no como 404.
  app.use("/api/v1", createUnavailableRouter());

  // ---- admin_routes + admin_operations ----
  app.use("/api/v1/admin", createAdminRouter(routesController));
  app.use("/api/v1/admin/trips", createTripsRouter(operationsController));
  app.use("/api/v1/admin/trip-guides", createTripGuidesRouter(operationsController));
  app.use("/api/v1/admin/guide-faults", createGuideFaultsRouter(operationsController));

  // ---- Geolocalizacion (solo paths de Python) ----
  app.use("/api/v1/routes", createPathsRouter(pathsController));
  app.use("/api/v1/meeting-points", createMeetingPointsRouter(pathsController));
  app.use("/api/v1/imports", createImportsRouter(pathsController));
  app.use("/api/v1/status", createStatusRouter(pathsController));

  // ---- Tracking GPS (solo el componente Go) ----
  app.use("/api/v1/tracking-sessions", createTrackingSessionsRouter(gpsController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
