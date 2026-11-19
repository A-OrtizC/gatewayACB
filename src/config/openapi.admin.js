// Rutas que el gateway agrega para exponer los contratos reales de
// adminACB (routes/operations), geolocaACB (paths) y el tracking GPS en Go.
// Se mantienen en un archivo aparte para que openapi.js siga siendo legible.

const correlation = { $ref: "#/components/parameters/CorrelationId" };
const upstreamErrors = {
  400: { $ref: "#/components/responses/BadRequest" },
  401: { $ref: "#/components/responses/Unauthorized" },
  403: { $ref: "#/components/responses/Forbidden" },
  404: { $ref: "#/components/responses/NotFound" },
  502: { $ref: "#/components/responses/UpstreamError" },
  504: { $ref: "#/components/responses/UpstreamTimeout" },
};

function jsonResponse(description) {
  return {
    description,
    content: {
      "application/json": {
        schema: { type: "object" },
      },
    },
  };
}

function operation({
  tag,
  summary,
  description,
  operationId,
  params = [],
  body = false,
  responses = {},
  security = [{ bearerAuth: [] }],
}) {
  const result = {
    tags: [tag],
    summary,
    description: description || summary,
    operationId,
    security,
    parameters: [correlation, ...params],
    responses: {
      200: jsonResponse("Respuesta del microservicio."),
      ...upstreamErrors,
      ...responses,
    },
  };
  if (body) {
    result.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { type: "object" },
        },
      },
    };
  }
  return result;
}

function noContent() {
  return { 204: { description: "Operación aplicada sin contenido de respuesta." } };
}

function idParam(name, description) {
  return {
    name,
    in: "path",
    required: true,
    description,
    schema: { type: "integer", format: "int64", minimum: 1 },
  };
}

function buildExtendedPaths() {
  const adminId = idParam("id", "Identificador numérico del recurso.");
  const tripId = idParam("tripId", "Identificador del viaje.");
  const trackingId = {
    name: "trackingId",
    in: "path",
    required: true,
    description: "Identificador de la sesión de tracking emitido por el componente Go.",
    schema: { type: "string", minLength: 1, maxLength: 256 },
  };

  return {
    // ---- Alias administrativos usados por presentationACB ----
    "/admin/auth/login": {
      post: operation({
        tag: "Auth",
        summary: "Iniciar sesión (alias administrativo)",
        description:
          "Equivalente a POST /auth/login. Nginx reescribe /api/admin/auth/login a esta ruta.",
        operationId: "adminLogin",
        body: true,
        security: [],
      }),
    },
    "/admin/guides": {
      get: operation({
        tag: "Guides",
        summary: "Listar guías (alias administrativo)",
        operationId: "adminListGuides",
      }),
      post: operation({
        tag: "Guides",
        summary: "Crear guía (alias administrativo)",
        operationId: "adminCreateGuide",
        body: true,
      }),
    },
    "/admin/guides/{id}": {
      get: operation({
        tag: "Guides",
        summary: "Consultar guía (alias administrativo)",
        operationId: "adminGetGuide",
        params: [idParam("id", "Identificador del guía.")],
      }),
      put: operation({
        tag: "Guides",
        summary: "Actualizar guía (alias administrativo)",
        operationId: "adminUpdateGuide",
        params: [idParam("id", "Identificador del guía.")],
        body: true,
      }),
    },
    "/admin/students": {
      get: operation({
        tag: "Students",
        summary: "Listar estudiantes (alias administrativo)",
        operationId: "adminListStudents",
      }),
      post: operation({
        tag: "Students",
        summary: "Crear estudiante (alias administrativo)",
        operationId: "adminCreateStudent",
        body: true,
      }),
    },
    "/admin/students/{id}": {
      get: operation({
        tag: "Students",
        summary: "Consultar estudiante (alias administrativo)",
        operationId: "adminGetStudent",
        params: [idParam("id", "Identificador del estudiante.")],
      }),
      put: operation({
        tag: "Students",
        summary: "Actualizar estudiante (alias administrativo)",
        operationId: "adminUpdateStudent",
        params: [idParam("id", "Identificador del estudiante.")],
        body: true,
      }),
    },
    "/admin/search": {
      get: operation({
        tag: "Search",
        summary: "Buscar personas (alias administrativo)",
        operationId: "adminSearch",
      }),
    },

    // ---- admin_routes: colegios ----
    "/admin/schools": {
      get: operation({
        tag: "Schools",
        summary: "Listar colegios",
        operationId: "listSchools",
      }),
      post: operation({
        tag: "Schools",
        summary: "Crear colegio",
        operationId: "createSchool",
        body: true,
        responses: { 201: jsonResponse("Colegio creado.") },
      }),
    },
    "/admin/schools/{id}": {
      get: operation({
        tag: "Schools",
        summary: "Consultar colegio",
        operationId: "getSchool",
        params: [adminId],
      }),
      put: operation({
        tag: "Schools",
        summary: "Actualizar colegio",
        operationId: "updateSchool",
        params: [adminId],
        body: true,
      }),
      delete: operation({
        tag: "Schools",
        summary: "Desactivar colegio",
        operationId: "deleteSchool",
        params: [adminId],
        responses: noContent(),
      }),
    },

    // ---- admin_routes: rutas administrativas ----
    "/admin/routes": {
      get: operation({
        tag: "AdminRoutes",
        summary: "Listar rutas administrativas",
        description:
          "Acepta los filtros del servicio admin_routes (por ejemplo schoolId y zone) y los reenvía sin transformarlos.",
        operationId: "listAdminRoutes",
      }),
      post: operation({
        tag: "AdminRoutes",
        summary: "Crear ruta administrativa",
        operationId: "createAdminRoute",
        body: true,
        responses: { 201: jsonResponse("Ruta creada.") },
      }),
    },
    "/admin/routes/{id}": {
      get: operation({
        tag: "AdminRoutes",
        summary: "Consultar ruta administrativa",
        operationId: "getAdminRoute",
        params: [adminId],
      }),
      put: operation({
        tag: "AdminRoutes",
        summary: "Actualizar ruta administrativa",
        operationId: "updateAdminRoute",
        params: [adminId],
        body: true,
      }),
      delete: operation({
        tag: "AdminRoutes",
        summary: "Desactivar ruta administrativa",
        operationId: "deleteAdminRoute",
        params: [adminId],
        responses: noContent(),
      }),
    },
    "/admin/routes/{id}/overview": {
      get: operation({
        tag: "AdminRoutes",
        summary: "Consultar el resumen de una ruta administrativa",
        description:
          "Combina la ruta administrativa con su primer punto de encuentro y sus puntos extremos.",
        operationId: "getAdminRouteOverview",
        params: [adminId],
      }),
    },
    "/admin/routes/{id}/guides": {
      put: operation({
        tag: "AdminRoutes",
        summary: "Asignar guías a la ruta",
        operationId: "assignRouteGuides",
        params: [adminId],
        body: true,
      }),
    },
    "/admin/routes/{id}/students": {
      get: operation({
        tag: "AdminRoutes",
        summary: "Listar estudiantes matriculados en la ruta",
        description:
          "Respuesta enriquecida por el gateway: une la matrícula de admin_routes con el detalle de admin_users y los puntos de encuentro de cada estudiante.",
        operationId: "listRouteStudents",
        params: [adminId],
      }),
      post: operation({
        tag: "AdminRoutes",
        summary: "Matricular estudiante en la ruta",
        description:
          "Crea el usuario en admin_users, lo matricula en admin_routes y asigna sus puntos de encuentro en una sola operación.",
        operationId: "assignRouteStudent",
        params: [adminId],
        body: true,
        responses: { 201: jsonResponse("Estudiante matriculado.") },
      }),
    },
    "/admin/routes/{id}/attendance": {
      get: operation({
        tag: "AdminRoutes",
        summary: "Consultar el historial de asistencia de la ruta",
        operationId: "getRouteAttendanceHistory",
        params: [
          adminId,
          {
            name: "from",
            in: "query",
            required: true,
            description: "Fecha inicial en formato ISO 8601 (YYYY-MM-DD).",
            schema: { type: "string", format: "date" },
          },
          {
            name: "to",
            in: "query",
            required: true,
            description: "Fecha final en formato ISO 8601 (YYYY-MM-DD).",
            schema: { type: "string", format: "date" },
          },
        ],
      }),
    },
    "/admin/routes/{id}/meeting-points": {
      get: operation({
        tag: "AdminRoutes",
        summary: "Listar puntos de encuentro de la ruta",
        operationId: "listRouteMeetingPoints",
        params: [adminId],
      }),
      post: operation({
        tag: "AdminRoutes",
        summary: "Crear punto de encuentro de la ruta",
        operationId: "createRouteMeetingPoint",
        params: [adminId],
        body: true,
        responses: { 201: jsonResponse("Punto de encuentro creado.") },
      }),
    },
    "/admin/meeting-points/{id}": {
      get: operation({
        tag: "AdminRoutes",
        summary: "Consultar punto de encuentro administrativo",
        operationId: "getAdminMeetingPoint",
        params: [adminId],
      }),
      put: operation({
        tag: "AdminRoutes",
        summary: "Actualizar punto de encuentro administrativo",
        operationId: "updateAdminMeetingPoint",
        params: [adminId],
        body: true,
      }),
      delete: operation({
        tag: "AdminRoutes",
        summary: "Eliminar punto de encuentro administrativo",
        operationId: "deleteAdminMeetingPoint",
        params: [adminId],
        responses: noContent(),
      }),
    },
    "/admin/meeting-points/{id}/students": {
      get: operation({
        tag: "AdminRoutes",
        summary: "Listar estudiantes de un punto de encuentro",
        description: "El parámetro shift es obligatorio en el servicio admin_routes.",
        operationId: "getMeetingPointRoster",
        params: [
          adminId,
          {
            name: "shift",
            in: "query",
            required: true,
            description: "Jornada escolar.",
            schema: { type: "string", example: "541" },
          },
        ],
      }),
    },
    "/admin/route-students/{id}": {
      get: operation({
        tag: "AdminRoutes",
        summary: "Consultar matrícula de estudiante en ruta",
        description:
          "Se publica como route-students para no chocar con /admin/students, que pertenece a admin_users. Devuelve el detalle enriquecido con datos y puntos de encuentro.",
        operationId: "getRouteStudent",
        params: [adminId],
      }),
      put: operation({
        tag: "AdminRoutes",
        summary: "Actualizar matrícula de estudiante en ruta",
        operationId: "updateRouteStudent",
        params: [adminId],
        body: true,
      }),
      delete: operation({
        tag: "AdminRoutes",
        summary: "Desactivar matrícula de estudiante en ruta",
        operationId: "deleteRouteStudent",
        params: [adminId],
        responses: noContent(),
      }),
    },
    "/admin/route-students/{id}/meeting-points": {
      get: operation({
        tag: "AdminRoutes",
        summary: "Consultar puntos de encuentro de la matrícula",
        operationId: "getRouteStudentMeetingPoints",
        params: [adminId],
      }),
      put: operation({
        tag: "AdminRoutes",
        summary: "Asignar puntos de encuentro a la matrícula",
        operationId: "assignRouteStudentMeetingPoints",
        params: [adminId],
        body: true,
      }),
    },

    // ---- admin_operations: viajes ----
    "/admin/trips": {
      get: operation({
        tag: "Operations",
        summary: "Listar viajes por fecha",
        description:
          "Devuelve los viajes de una fecha con el formato normalizado que consume presentationACB.",
        operationId: "listTrips",
        params: [
          {
            name: "date",
            in: "query",
            required: true,
            description: "Fecha de los viajes en formato ISO 8601 (YYYY-MM-DD).",
            schema: { type: "string", format: "date" },
          },
          {
            name: "guideId",
            in: "query",
            required: false,
            description:
              "Filtra los viajes de un guía. Si el token pertenece a un GUIDE, el backend fuerza su propio identificador.",
            schema: { type: "integer", format: "int64", minimum: 1 },
          },
        ],
      }),
      post: operation({
        tag: "Operations",
        summary: "Crear viaje",
        operationId: "createTrip",
        body: true,
        responses: { 201: jsonResponse("Viaje creado.") },
      }),
    },
    "/admin/trips/by-route/{routeId}": {
      get: operation({
        tag: "Operations",
        summary: "Consultar viaje por ruta y fecha",
        operationId: "getTripByRoute",
        params: [
          idParam("routeId", "Identificador de la ruta administrativa."),
          {
            name: "date",
            in: "query",
            required: true,
            description: "Fecha del viaje en formato ISO 8601 (YYYY-MM-DD).",
            schema: { type: "string", format: "date" },
          },
        ],
      }),
    },
    "/admin/trips/{tripId}": {
      get: operation({
        tag: "Operations",
        summary: "Consultar viaje",
        operationId: "getTrip",
        params: [tripId],
      }),
    },
    "/admin/trips/{tripId}/overview": {
      get: operation({
        tag: "Operations",
        summary: "Consultar el resumen del viaje",
        description:
          "Combina el viaje, sus guías, la asistencia y los eventos en una sola respuesta.",
        operationId: "getTripOverview",
        params: [tripId],
      }),
    },
    "/admin/trips/{tripId}/guides": {
      get: operation({
        tag: "Operations",
        summary: "Listar guías del viaje",
        operationId: "listTripGuides",
        params: [tripId],
      }),
    },
    "/admin/trips/{tripId}/guides/{tripGuideId}/replacement": {
      put: operation({
        tag: "Operations",
        summary: "Reemplazar guía del viaje",
        operationId: "replaceTripGuide",
        params: [tripId, idParam("tripGuideId", "Identificador del guía dentro del viaje.")],
        body: true,
      }),
    },
    "/admin/trips/{tripId}/start": {
      post: operation({
        tag: "Operations",
        summary: "Iniciar viaje",
        operationId: "startTrip",
        params: [tripId],
      }),
    },
    "/admin/trips/{tripId}/finish": {
      post: operation({
        tag: "Operations",
        summary: "Finalizar viaje",
        operationId: "finishTrip",
        params: [tripId],
        body: true,
      }),
    },
    "/admin/trips/{tripId}/events": {
      get: operation({
        tag: "Operations",
        summary: "Listar eventos del viaje",
        operationId: "listTripEvents",
        params: [tripId],
      }),
      post: operation({
        tag: "Operations",
        summary: "Registrar evento del viaje",
        operationId: "createTripEvent",
        params: [tripId],
        body: true,
        responses: { 201: jsonResponse("Evento registrado.") },
      }),
    },

    // ---- admin_operations: asistencia ----
    "/admin/trips/{tripId}/attendance/roster": {
      post: {
        tags: ["Operations"],
        summary: "Inicializar lista de asistencia",
        operationId: "initializeRoster",
        security: [{ bearerAuth: [] }],
        parameters: [correlation, tripId],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "array", items: { type: "object" } },
            },
          },
        },
        responses: {
          201: jsonResponse("Lista de asistencia inicializada."),
          ...upstreamErrors,
        },
      },
    },
    "/admin/trips/{tripId}/attendance": {
      get: operation({
        tag: "Operations",
        summary: "Consultar asistencia del viaje",
        operationId: "listAttendance",
        params: [tripId],
      }),
      post: operation({
        tag: "Operations",
        summary: "Guardar la asistencia de un punto",
        description:
          "Inicializa el padrón y actualiza el estado de cada estudiante. present=true se guarda como 01 y present=false como 00.",
        operationId: "saveAttendance",
        params: [tripId],
        body: true,
        responses: { 201: jsonResponse("Asistencia guardada.") },
      }),
    },
    "/admin/trips/{tripId}/attendance/{studentId}": {
      put: operation({
        tag: "Operations",
        summary: "Registrar o actualizar asistencia de un estudiante",
        operationId: "updateAttendance",
        params: [tripId, idParam("studentId", "Identificador del estudiante.")],
        body: true,
      }),
    },

    // ---- admin_operations: faltas de guías ----
    "/admin/guide-faults/guides/{guideId}/cycles": {
      get: operation({
        tag: "Operations",
        summary: "Listar ciclos de faltas del guía",
        operationId: "listGuideCycles",
        params: [idParam("guideId", "Identificador del guía.")],
      }),
    },
    "/admin/guide-faults/cycles/{cycleId}/minor": {
      get: operation({
        tag: "Operations",
        summary: "Listar faltas menores del ciclo",
        operationId: "listMinorFaults",
        params: [idParam("cycleId", "Identificador del ciclo.")],
      }),
    },
    "/admin/guide-faults/major/{majorFaultId}": {
      get: operation({
        tag: "Operations",
        summary: "Consultar falta mayor",
        operationId: "getMajorFault",
        params: [idParam("majorFaultId", "Identificador de la falta mayor.")],
      }),
    },
    "/admin/guide-faults/minor/{minorFaultId}/notified": {
      put: operation({
        tag: "Operations",
        summary: "Marcar falta menor como notificada",
        operationId: "notifyMinorFault",
        params: [idParam("minorFaultId", "Identificador de la falta menor.")],
      }),
    },
    "/admin/guide-faults/major/{majorFaultId}/notified": {
      put: operation({
        tag: "Operations",
        summary: "Marcar falta mayor como notificada",
        operationId: "notifyMajorFault",
        params: [idParam("majorFaultId", "Identificador de la falta mayor.")],
      }),
    },
    "/admin/guide-faults/major/{majorFaultId}/minuted": {
      put: operation({
        tag: "Operations",
        summary: "Marcar falta mayor como minuted",
        operationId: "minuteMajorFault",
        params: [idParam("majorFaultId", "Identificador de la falta mayor.")],
        responses: noContent(),
      }),
    },

    // ---- admin_operations: check-ins ----
    "/admin/trip-guides/{tripGuideId}/check-ins": {
      get: operation({
        tag: "Operations",
        summary: "Listar intentos de check-in del guía en el viaje",
        operationId: "listGuideCheckIns",
        params: [idParam("tripGuideId", "Identificador del guía dentro del viaje.")],
      }),
    },

    // ---- geolocaACB: paths ----
    "/imports/kmz": {
      post: {
        tags: ["Routes"],
        summary: "Importar datos KMZ (ruta canónica de geoloca)",
        description:
          "Alias de /routes/imports/kmz que coincide con la ruta real del servicio de paths.",
        operationId: "importKmzCanonical",
        security: [],
        parameters: [correlation],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          201: jsonResponse("Archivo importado."),
          ...upstreamErrors,
        },
      },
    },
    "/status/notify": {
      post: {
        tags: ["Status"],
        summary: "Notificar un código operativo",
        description:
          "Reenvía el reporte de código al servicio de paths, que calcula llegadas y clasificaciones.",
        operationId: "notifyOperationalStatus",
        security: [],
        parameters: [correlation],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          201: jsonResponse("Código registrado."),
          ...upstreamErrors,
        },
      },
    },
    "/routes/{id}/first-meeting-point/validate": {
      post: {
        tags: ["Routes"],
        summary: "Validar el primer punto de encuentro (PE01)",
        operationId: "validateFirstMeetingPoint",
        security: [],
        parameters: [correlation, { $ref: "#/components/parameters/RouteId" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          200: jsonResponse("Resultado de la validación geográfica."),
          ...upstreamErrors,
        },
      },
    },

    // ---- Tracking GPS: exclusivamente el componente Go ----
    "/tracking-sessions": {
      post: {
        tags: ["Tracking"],
        summary: "Crear sesión de tracking",
        description:
          "El gateway agrega el token interno de servicio y reenvía Idempotency-Key. Solo el componente Go atiende tracking; el tracking de Python es legado.",
        operationId: "createTrackingSession",
        parameters: [
          correlation,
          {
            name: "Idempotency-Key",
            in: "header",
            required: false,
            schema: { type: "string", maxLength: 256 },
          },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          201: jsonResponse("Sesión creada."),
          200: jsonResponse(
            "Sesión ya existente para la misma Idempotency-Key (replay)."
          ),
          503: {
            description:
              "Almacenamiento GPS no disponible temporalmente (incluye Retry-After).",
            headers: {
              "Retry-After": {
                schema: { type: "integer", minimum: 0 },
                description: "Segundos que el cliente debe esperar antes de reintentar.",
              },
            },
          },
          ...upstreamErrors,
        },
      },
    },
    "/tracking-sessions/{trackingId}": {
      get: {
        tags: ["Tracking"],
        summary: "Consultar sesión de tracking",
        operationId: "getTrackingSession",
        parameters: [correlation, trackingId],
        responses: {
          200: jsonResponse("Sesión de tracking."),
          ...upstreamErrors,
        },
      },
    },
    "/tracking-sessions/{trackingId}/observations": {
      post: {
        tags: ["Tracking"],
        summary: "Registrar observación de posición",
        description: "Conserva el Bearer propio de la sesión; no usa el token interno.",
        operationId: "createTrackingObservation",
        parameters: [correlation, trackingId],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          201: jsonResponse("Observación registrada."),
          200: jsonResponse("Observación ya registrada (replay de Idempotency-Key)."),
          ...upstreamErrors,
          401: {
            description:
              "Credencial de sesión inválida, cerrada o inexistente (incluye WWW-Authenticate).",
            headers: {
              "WWW-Authenticate": {
                schema: { type: "string" },
                description: "Esquema de autenticación esperado por el componente Go.",
              },
            },
          },
        },
      },
    },
    "/tracking-sessions/{trackingId}/positions": {
      get: {
        tags: ["Tracking"],
        summary: "Listar posiciones de la sesión",
        operationId: "listTrackingPositions",
        parameters: [
          correlation,
          trackingId,
          {
            name: "after_sequence",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 0 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
          },
        ],
        responses: {
          200: jsonResponse("Posiciones registradas."),
          ...upstreamErrors,
        },
      },
    },
    "/tracking-sessions/{trackingId}/latest-position": {
      get: {
        tags: ["Tracking"],
        summary: "Consultar la última posición",
        operationId: "getLatestTrackingPosition",
        parameters: [correlation, trackingId],
        responses: {
          200: jsonResponse("Última posición conocida."),
          ...upstreamErrors,
        },
      },
    },
    "/tracking-sessions/{trackingId}/control": {
      get: {
        tags: ["Tracking"],
        summary: "Consultar el estado de control de la sesión",
        operationId: "getTrackingControl",
        parameters: [correlation, trackingId],
        responses: {
          200: jsonResponse("Estado de control."),
          ...upstreamErrors,
        },
      },
    },
    "/tracking-sessions/{trackingId}/finish": {
      post: {
        tags: ["Tracking"],
        summary: "Finalizar seguimiento técnico",
        operationId: "finishTrackingSession",
        parameters: [correlation, trackingId],
        responses: {
          200: jsonResponse("Sesión finalizada."),
          ...upstreamErrors,
        },
      },
    },
    "/tracking-sessions/{trackingId}/disable": {
      patch: {
        tags: ["Tracking"],
        summary: "Deshabilitar seguimiento técnico",
        operationId: "disableTrackingSession",
        parameters: [correlation, trackingId],
        responses: {
          200: jsonResponse("Sesión deshabilitada."),
          ...upstreamErrors,
        },
      },
    },
  };
}

module.exports = { buildExtendedPaths };
