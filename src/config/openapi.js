const packageJson = require("../../package.json");

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "API Gateway ACB",
    version: packageJson.version,
    description:
      "Documentación de los endpoints expuestos por el API Gateway. El gateway reenvía las peticiones a los microservicios de autenticación, usuarios y rutas geográficas, y normaliza los errores de comunicación en el formato { error: { code, message, correlationId } }."
  },
  servers: [
    {
      url: "/api/v1",
      description: "API versionada"
    }
  ],
  tags: [
    {
      name: "Health",
      description: "Estado operativo del gateway"
    },
    {
      name: "Auth",
      description: "Autenticación de usuarios del sistema"
    },
    {
      name: "Guides",
      description: "Consulta y administración de guías escolares"
    },
    {
      name: "Students",
      description: "Consulta y administración de estudiantes y sus acudientes"
    },
    {
      name: "Search",
      description: "Búsqueda de personas por tipo y número de documento"
    },
    {
      name: "Routes",
      description: "Consultas y operaciones disponibles para el servicio de rutas geográficas"
    },
    {
      name: "MeetingPoints",
      description: "Consulta de puntos de encuentro geográficos"
    },
    {
      name: "Status",
      description: "Notificación de estado de rutas y validación geográfica"
    },
    {
      name: "Operations",
      description:
        "Operación de viajes, asistencia de estudiantes, eventos y faltas de guías"
    },
    {
      name: "AdminRoutes",
      description:
        "Administración de rutas, colegios, estudiantes y puntos de encuentro"
    },
    {
      name: "Tracking",
      description:
        "Sesiones de seguimiento GPS gestionadas por el servicio Go acb_gps_lo"
    }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Verificar el estado del gateway",
        description: "Devuelve el estado operativo del API Gateway.",
        operationId: "getHealth",
        security: [],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        responses: {
          200: {
            description: "El gateway está funcionando correctamente.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse"
                }
              }
            }
          }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión",
        description:
          "Autentica a un usuario y devuelve un token JWT junto con su identificador y rol. El token se envía como Bearer en los endpoints de guías, estudiantes y búsqueda.",
        operationId: "login",
        security: [],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Autenticación exitosa.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/guides": {
      get: {
        tags: ["Guides"],
        summary: "Listar guías",
        description:
          "Devuelve una página de guías escolares. Los parámetros de paginación se reenvían al servicio de usuarios.",
        operationId: "findGuides",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/Size" },
          { $ref: "#/components/parameters/Sort" }
        ],
        responses: {
          200: {
            description: "Página de guías devuelta por el servicio de usuarios.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GuidePage" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      post: {
        tags: ["Guides"],
        summary: "Registrar un guía",
        description:
          "Crea un usuario con rol GUIDE y su registro de guía en una sola operación.",
        operationId: "createGuide",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GuideRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Guía creado por el servicio de usuarios.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Guide" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/guides/{id}": {
      get: {
        tags: ["Guides"],
        summary: "Consultar un guía",
        operationId: "getGuide",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/GuideId" }
        ],
        responses: {
          200: {
            description: "Guía encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GuideDetail" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      put: {
        tags: ["Guides"],
        summary: "Actualizar un guía",
        description:
          "Actualiza los datos propios del guía: contrato, correo y zona.",
        operationId: "updateGuide",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/GuideId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GuideRegistration" }
            }
          }
        },
        responses: {
          200: {
            description: "Guía actualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GuideDetail" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/students": {
      get: {
        tags: ["Students"],
        summary: "Listar estudiantes",
        description:
          "Devuelve una página de estudiantes. Los parámetros de paginación se reenvían al servicio de usuarios.",
        operationId: "findStudents",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/Size" },
          { $ref: "#/components/parameters/Sort" }
        ],
        responses: {
          200: {
            description: "Página de estudiantes devuelta por el servicio de usuarios.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudentPage" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      post: {
        tags: ["Students"],
        summary: "Registrar un estudiante",
        description:
          "Crea un usuario con rol STUDENT y su registro académico en una sola operación.",
        operationId: "createStudent",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StudentRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Estudiante creado por el servicio de usuarios.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Student" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/students/school/{schoolId}": {
      get: {
        tags: ["Students"],
        summary: "Listar estudiantes por colegio",
        description:
          "Devuelve una página de estudiantes asociados al colegio indicado.",
        operationId: "findStudentsBySchool",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/SchoolId" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/Size" },
          { $ref: "#/components/parameters/Sort" }
        ],
        responses: {
          200: {
            description: "Página de estudiantes del colegio.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudentPage" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/students/{id}/guardians": {
      post: {
        tags: ["Students"],
        summary: "Asignar un acudiente a un estudiante",
        description:
          "Asocia un usuario con rol GUARDIAN al estudiante indicado. El gateway responde 201 con cuerpo vacío cuando el servicio de usuarios acepta la asignación.",
        operationId: "assignGuardian",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/StudentId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AssignGuardianRequest" }
            }
          }
        },
        responses: {
          201: {
            description:
              "Acudiente asignado. El servicio de usuarios no devuelve contenido."
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/students/{id}": {
      get: {
        tags: ["Students"],
        summary: "Consultar un estudiante",
        operationId: "getStudent",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/StudentId" }
        ],
        responses: {
          200: {
            description: "Estudiante encontrado, incluyendo sus acudientes.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudentDetail" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      put: {
        tags: ["Students"],
        summary: "Actualizar un estudiante",
        description:
          "Actualiza la información académica del estudiante (grado, jornada, sección y colegio).",
        operationId: "updateStudent",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/StudentId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StudentRegistration" }
            }
          }
        },
        responses: {
          200: {
            description: "Estudiante actualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudentDetail" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/search": {
      get: {
        tags: ["Search"],
        summary: "Buscar una persona por documento",
        description:
          "Busca una persona activa por tipo y número de documento. Según su rol, la respuesta es un estudiante (con acudientes), un guía o un resumen de usuario.",
        operationId: "searchPerson",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/DocumentType" },
          { $ref: "#/components/parameters/DocumentNumber" }
        ],
        responses: {
          200: {
            description:
              "Persona encontrada. El esquema depende del rol del usuario.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PersonSearchResult" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/meeting-points": {
      get: {
        tags: ["MeetingPoints"],
        summary: "Listar puntos de encuentro",
        description: "Devuelve los puntos de encuentro almacenados por el servicio de paths.",
        operationId: "listMeetingPoints",
        security: [],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        responses: {
          200: {
            description: "Puntos de encuentro disponibles.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/MeetingPoint" }
                }
              }
            }
          },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/routes": {
      get: {
        tags: ["Routes"],
        summary: "Listar rutas geográficas",
        description:
          "Devuelve el arreglo completo de rutas geográficas almacenadas en el servicio de paths. Cualquier parámetro de consulta se reenvía, pero el servicio actual devuelve todas las rutas sin aplicar filtros.",
        operationId: "findRoutes",
        security: [],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        responses: {
          200: {
            description: "Arreglo de rutas devuelto por el servicio de paths.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/GeoRoute" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/routes/search": {
      get: {
        tags: ["Routes"],
        summary: "Buscar rutas por código",
        description:
          "Busca rutas por la combinación exacta de code y route_code. Ambos parámetros son obligatorios en el servicio de paths.",
        operationId: "searchRoutes",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/RouteCode" },
          { $ref: "#/components/parameters/RouteCodeAlternative" }
        ],
        responses: {
          200: {
            description: "Rutas que coinciden con los códigos indicados.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/GeoRoute" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/routes/{id}": {
      get: {
        tags: ["Routes"],
        summary: "Consultar una ruta",
        description:
          "Devuelve una ruta geográfica con sus puntos de encuentro resueltos. El id corresponde al ObjectId de MongoDB del servicio de paths.",
        operationId: "getRoute",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/RouteId" }
        ],
        responses: {
          200: {
            description: "Ruta encontrada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GeoRouteDetail" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/routes/{id}/overview": {
      get: {
        tags: ["Routes"],
        summary: "Consultar el resumen de una ruta",
        description:
          "Compone en una sola respuesta la ruta, su primer punto de encuentro y sus puntos extremos.",
        operationId: "getRouteOverview",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/RouteId" }
        ],
        responses: {
          200: {
            description: "Resumen de la ruta.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RouteOverview" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/routes/{id}/first-meeting-point": {
      get: {
        tags: ["Routes"],
        summary: "Consultar el primer punto de encuentro",
        description:
          "Devuelve el primer punto de encuentro configurado para la ruta.",
        operationId: "getRouteFirstMeetingPoint",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/RouteId" }
        ],
        responses: {
          200: {
            description: "Primer punto de encuentro de la ruta.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FirstMeetingPoint" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/routes/{id}/endpoints": {
      get: {
        tags: ["Routes"],
        summary: "Consultar los puntos extremos de una ruta",
        description:
          "Devuelve los puntos de inicio y fin resueltos para la ruta, junto con su estado.",
        operationId: "getRouteEndpoints",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/RouteId" }
        ],
        responses: {
          200: {
            description: "Puntos extremos de la ruta.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RouteEndpointsView" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/routes/imports/kmz": {
      post: {
        tags: ["Routes"],
        summary: "Importar datos KMZ",
        description:
          "Reenvía el archivo KMZ en el campo multipart 'file'. El servicio de paths admite archivos de hasta 20 MiB.",
        operationId: "importKmz",
        security: [],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "Archivo .kmz (máximo 20 MiB)."
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Importación procesada por el servicio de paths.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RouteImportResult" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          413: {
            description: "El archivo supera el límite de tamaño permitido.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/routes/{id}/first-meeting-point/validate": {
      post: {
        tags: ["Status"],
        summary: "Validar una ubicación contra el primer punto de encuentro",
        description:
          "Reenvía la ubicación al servicio de paths para comprobar si está dentro del radio aceptado del primer punto de encuentro de la ruta.",
        operationId: "validateFirstMeetingPoint",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/RouteId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/GeographicValidationRequest"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Resultado de la validación geográfica.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GeographicValidation" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/status/notify": {
      post: {
        tags: ["Status"],
        summary: "Notificar el estado de una ruta",
        description:
          "Reenvía al servicio de paths la notificación de estado operativo de una ruta.",
        operationId: "notifyRouteStatus",
        security: [],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StatusNotifyRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Notificación registrada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StatusNotifyResponse" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips": {
      post: {
        tags: ["Operations"],
        summary: "Crear un viaje",
        description:
          "Crea un viaje para una ruta y fecha. El servicio de operaciones devuelve 201.",
        operationId: "createTrip",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TripRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Viaje creado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Trip" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/{tripId}": {
      get: {
        tags: ["Operations"],
        summary: "Consultar un viaje",
        operationId: "getTrip",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" }
        ],
        responses: {
          200: {
            description: "Viaje encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Trip" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/{tripId}/overview": {
      get: {
        tags: ["Operations"],
        summary: "Consultar el resumen operativo de un viaje",
        description:
          "Compone en una sola respuesta el viaje, sus guías, la asistencia de estudiantes y los eventos.",
        operationId: "getTripOverview",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" }
        ],
        responses: {
          200: {
            description: "Resumen operativo del viaje.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TripOverview" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/{tripId}/guides": {
      get: {
        tags: ["Operations"],
        summary: "Listar los guías asignados a un viaje",
        operationId: "listTripGuides",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" }
        ],
        responses: {
          200: {
            description: "Guías del viaje.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/TripGuide" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/{tripId}/guides/{tripGuideId}/replacement": {
      put: {
        tags: ["Operations"],
        summary: "Reemplazar un guía del viaje",
        operationId: "replaceTripGuide",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" },
          { $ref: "#/components/parameters/TripGuideId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TripGuideReplacementRequest"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Guía reemplazado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TripGuide" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/by-route/{routeId}": {
      get: {
        tags: ["Operations"],
        summary: "Consultar el viaje de una ruta en una fecha",
        operationId: "getTripByRouteAndDate",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/OperationRouteId" },
          { $ref: "#/components/parameters/TripDate" }
        ],
        responses: {
          200: {
            description: "Viaje de la ruta en la fecha indicada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Trip" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/{tripId}/start": {
      post: {
        tags: ["Operations"],
        summary: "Iniciar un viaje",
        operationId: "startTrip",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" }
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TripLifecycleRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Viaje iniciado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Trip" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/{tripId}/finish": {
      post: {
        tags: ["Operations"],
        summary: "Finalizar un viaje",
        description:
          "El gateway no reenvía cuerpo. El servicio de operaciones completa el viaje.",
        operationId: "finishTrip",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" }
        ],
        responses: {
          200: {
            description: "Viaje finalizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Trip" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/{tripId}/events": {
      get: {
        tags: ["Operations"],
        summary: "Listar los eventos de un viaje",
        operationId: "listTripEvents",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" }
        ],
        responses: {
          200: {
            description: "Eventos del viaje.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/TripEvent" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      post: {
        tags: ["Operations"],
        summary: "Registrar un evento de viaje",
        operationId: "registerTripEvent",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TripEventRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Evento registrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TripEvent" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/{tripId}/attendance": {
      get: {
        tags: ["Operations"],
        summary: "Listar la asistencia de estudiantes del viaje",
        operationId: "listStudentAttendance",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" }
        ],
        responses: {
          200: {
            description: "Asistencia registrada.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StudentAttendance" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/{tripId}/attendance/roster": {
      post: {
        tags: ["Operations"],
        summary: "Inicializar el roster de asistencia",
        description:
          "El cuerpo es un arreglo JSON con las entradas del roster. El servicio de operaciones devuelve 201.",
        operationId: "initializeAttendanceRoster",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/AttendanceRosterEntry"
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Roster inicializado.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StudentAttendance" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trips/{tripId}/attendance/{studentId}": {
      put: {
        tags: ["Operations"],
        summary: "Registrar o actualizar la asistencia de un estudiante",
        operationId: "registerOrUpdateAttendance",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripId" },
          { $ref: "#/components/parameters/AttendanceStudentId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AttendanceCommand" }
            }
          }
        },
        responses: {
          200: {
            description: "Asistencia registrada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudentAttendance" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/trip-guides/{tripGuideId}/check-ins": {
      get: {
        tags: ["Operations"],
        summary: "Consultar los intentos de check-in de un guía de viaje",
        description:
          "Expone únicamente la auditoría de solo lectura. El endpoint interno de escritura no está publicado por el gateway.",
        operationId: "listGuideCheckIns",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TripGuideId" }
        ],
        responses: {
          200: {
            description: "Intentos de check-in del guía de viaje.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/GuideCheckInAttempt" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/guide-faults/guides/{guideId}/cycles": {
      get: {
        tags: ["Operations"],
        summary: "Listar los ciclos de faltas de un guía",
        operationId: "listGuideFaultCycles",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/GuideIdPath" }
        ],
        responses: {
          200: {
            description: "Ciclos de faltas del guía.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/GuideFaultCycle" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/guide-faults/cycles/{cycleId}/minor": {
      get: {
        tags: ["Operations"],
        summary: "Listar las faltas leves de un ciclo",
        operationId: "listMinorFaults",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/CycleId" }
        ],
        responses: {
          200: {
            description: "Faltas leves del ciclo.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/MinorFault" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/guide-faults/major/{majorFaultId}": {
      get: {
        tags: ["Operations"],
        summary: "Consultar una falta grave",
        operationId: "getMajorFault",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/MajorFaultId" }
        ],
        responses: {
          200: {
            description: "Falta grave encontrada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MajorFault" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/guide-faults/minor/{minorFaultId}/notified": {
      put: {
        tags: ["Operations"],
        summary: "Marcar una falta leve como notificada",
        operationId: "markMinorFaultNotified",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/MinorFaultId" }
        ],
        responses: {
          200: {
            description: "Falta leve notificada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MinorFault" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/guide-faults/major/{majorFaultId}/notified": {
      put: {
        tags: ["Operations"],
        summary: "Marcar una falta grave como notificada",
        operationId: "markMajorFaultNotified",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/MajorFaultId" }
        ],
        responses: {
          200: {
            description: "Falta grave notificada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MajorFault" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/guide-faults/major/{majorFaultId}/minuted": {
      put: {
        tags: ["Operations"],
        summary: "Marcar una falta grave como minuciada",
        operationId: "markMajorFaultMinuted",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/MajorFaultId" }
        ],
        responses: {
          204: { description: "Falta grave minuciada sin contenido." },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/routes": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Listar rutas administrativas",
        operationId: "adminListRoutes",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminSchoolIdQuery" },
          { $ref: "#/components/parameters/AdminZone" }
        ],
        responses: {
          200: {
            description: "Rutas administrativas.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AdminRoute" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      post: {
        tags: ["AdminRoutes"],
        summary: "Crear una ruta administrativa",
        operationId: "adminCreateRoute",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminRouteRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Ruta creada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminRoute" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/routes/{id}": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Consultar una ruta administrativa",
        operationId: "adminGetRoute",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        responses: {
          200: {
            description: "Ruta encontrada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminRoute" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      put: {
        tags: ["AdminRoutes"],
        summary: "Actualizar una ruta administrativa",
        operationId: "adminUpdateRoute",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminRouteRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Ruta actualizada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminRoute" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      delete: {
        tags: ["AdminRoutes"],
        summary: "Desactivar una ruta administrativa",
        operationId: "adminDeactivateRoute",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        responses: {
          204: { description: "Ruta desactivada sin contenido." },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/routes/{id}/overview": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Consultar el resumen administrativo de una ruta",
        description:
          "Compone la ruta, sus puntos de encuentro y sus estudiantes.",
        operationId: "adminGetRouteOverview",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        responses: {
          200: {
            description: "Resumen administrativo de la ruta.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminRouteOverview" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/routes/{id}/guides": {
      put: {
        tags: ["AdminRoutes"],
        summary: "Asignar guías a una ruta",
        operationId: "adminAssignGuidesToRoute",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AssignGuidesToRouteRequest"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Guías asignados.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminRoute" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/routes/{routeId}/meeting-points": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Listar los puntos de encuentro de una ruta",
        operationId: "adminListMeetingPointsForRoute",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminRouteId" }
        ],
        responses: {
          200: {
            description: "Puntos de encuentro de la ruta.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AdminMeetingPoint" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      post: {
        tags: ["AdminRoutes"],
        summary: "Crear un punto de encuentro para una ruta",
        operationId: "adminCreateMeetingPoint",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminRouteId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminMeetingPointRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Punto de encuentro creado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminMeetingPoint" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/meeting-points/{id}": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Consultar un punto de encuentro",
        operationId: "adminGetMeetingPoint",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        responses: {
          200: {
            description: "Punto de encuentro encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminMeetingPoint" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      put: {
        tags: ["AdminRoutes"],
        summary: "Actualizar un punto de encuentro",
        operationId: "adminUpdateMeetingPoint",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminMeetingPointRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Punto de encuentro actualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminMeetingPoint" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      delete: {
        tags: ["AdminRoutes"],
        summary: "Eliminar un punto de encuentro",
        operationId: "adminDeleteMeetingPoint",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        responses: {
          204: { description: "Punto de encuentro eliminado sin contenido." },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/meeting-points/{id}/students": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Consultar el llamado a lista en un punto de encuentro",
        operationId: "adminGetRosterAtMeetingPoint",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" },
          { $ref: "#/components/parameters/Shift" }
        ],
        responses: {
          200: {
            description: "Estudiantes del punto de encuentro para la jornada.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AdminStudent" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/routes/{routeId}/students": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Listar los estudiantes de una ruta",
        operationId: "adminListStudentsByRoute",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminRouteId" }
        ],
        responses: {
          200: {
            description: "Estudiantes de la ruta.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AdminStudent" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      post: {
        tags: ["AdminRoutes"],
        summary: "Asignar un estudiante a una ruta",
        operationId: "adminAssignStudentToRoute",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminRouteId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminStudentRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Estudiante asignado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminStudent" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/students/{id}": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Consultar un estudiante",
        operationId: "adminGetStudent",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        responses: {
          200: {
            description: "Estudiante encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminStudent" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      put: {
        tags: ["AdminRoutes"],
        summary: "Actualizar un estudiante",
        operationId: "adminUpdateStudent",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AdminStudentUpdateRequest"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Estudiante actualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminStudent" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      delete: {
        tags: ["AdminRoutes"],
        summary: "Desactivar un estudiante",
        operationId: "adminDeactivateStudent",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        responses: {
          204: { description: "Estudiante desactivado sin contenido." },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/students/{id}/meeting-points": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Consultar los puntos de encuentro de un estudiante",
        operationId: "adminGetStudentMeetingPoints",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        responses: {
          200: {
            description: "Puntos de encuentro del estudiante por jornada.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/StudentMeetingPoint"
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      put: {
        tags: ["AdminRoutes"],
        summary: "Asignar los puntos de encuentro de un estudiante",
        operationId: "adminAssignStudentMeetingPoints",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AssignStudentMeetingPointsRequest"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Puntos de encuentro asignados.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/StudentMeetingPoint"
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/schools": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Listar colegios",
        operationId: "adminListSchools",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminZone" }
        ],
        responses: {
          200: {
            description: "Colegios administrativos.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AdminSchool" }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      post: {
        tags: ["AdminRoutes"],
        summary: "Crear un colegio",
        operationId: "adminCreateSchool",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminSchoolRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Colegio creado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminSchool" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/admin/schools/{id}": {
      get: {
        tags: ["AdminRoutes"],
        summary: "Consultar un colegio",
        operationId: "adminGetSchool",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        responses: {
          200: {
            description: "Colegio encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminSchool" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      put: {
        tags: ["AdminRoutes"],
        summary: "Actualizar un colegio",
        operationId: "adminUpdateSchool",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminSchoolRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Colegio actualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminSchool" }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      },
      delete: {
        tags: ["AdminRoutes"],
        summary: "Desactivar un colegio",
        operationId: "adminDeactivateSchool",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/AdminId" }
        ],
        responses: {
          204: { description: "Colegio desactivado sin contenido." },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/tracking-sessions": {
      post: {
        tags: ["Tracking"],
        summary: "Crear una sesión de seguimiento",
        description:
          "Reenvía la creación al servicio Go. Devuelve 201 cuando la sesión es nueva y 200 cuando el Idempotency-Key ya fue procesado (replay).",
        operationId: "createTrackingSession",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/IdempotencyKey" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TrackingSessionCreateRequest"
              }
            }
          }
        },
        responses: {
          201: {
            description: "Sesión de seguimiento creada.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TrackingSessionCreatedResponse"
                }
              }
            }
          },
          200: {
            description:
              "Replay idempotente: la sesión ya había sido creada con esa Idempotency-Key.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TrackingSessionCreatedResponse"
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: {
            description: "La Idempotency-Key entra en conflicto con otra sesión.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          503: {
            description:
              "El servicio GPS no está disponible temporalmente (incluye Retry-After).",
            headers: {
              "Retry-After": {
                description: "Segundos recomendados antes de reintentar.",
                schema: { type: "string", example: "1" }
              }
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/tracking-sessions/{trackingId}": {
      get: {
        tags: ["Tracking"],
        summary: "Consultar el estado de una sesión de seguimiento",
        operationId: "getTrackingSession",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TrackingId" }
        ],
        responses: {
          200: {
            description: "Sesión de seguimiento encontrada.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TrackingSessionStatusResponse"
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: {
            description:
              "Credencial de servicio inválida o ausente (incluye WWW-Authenticate).",
            headers: {
              "WWW-Authenticate": {
                description: "Esquema de autenticación exigido por el GPS.",
                schema: { type: "string", example: "Bearer" }
              }
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/tracking-sessions/{trackingId}/control": {
      get: {
        tags: ["Tracking"],
        summary: "Consultar el control de una sesión de seguimiento",
        operationId: "getTrackingSessionControl",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TrackingId" }
        ],
        responses: {
          200: {
            description: "Control de la sesión.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TrackingSessionControlResponse"
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/tracking-sessions/{trackingId}/positions": {
      get: {
        tags: ["Tracking"],
        summary: "Listar las posiciones de una sesión de seguimiento",
        description:
          "Paginación por secuencia. El servicio Go usa limit=50 por defecto y no admite más de 100.",
        operationId: "listTrackingSessionPositions",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TrackingId" },
          { $ref: "#/components/parameters/AfterSequence" },
          { $ref: "#/components/parameters/PositionsLimit" }
        ],
        responses: {
          200: {
            description: "Página de posiciones.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TrackingPositionsResponse"
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/tracking-sessions/{trackingId}/latest-position": {
      get: {
        tags: ["Tracking"],
        summary: "Consultar la última posición de una sesión",
        description:
          "Devuelve 204 si la sesión todavía no tiene observaciones y 410 si la última posición expiró.",
        operationId: "getTrackingSessionLatestPosition",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TrackingId" }
        ],
        responses: {
          200: {
            description: "Última posición registrada.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TrackingLatestPositionResponse"
                }
              }
            }
          },
          204: { description: "La sesión no tiene observaciones." },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          410: {
            description: "La última posición expiró.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/tracking-sessions/{trackingId}/observations": {
      post: {
        tags: ["Tracking"],
        summary: "Registrar una observación de posición",
        description:
          "Usa el Bearer de la sesión emitido en la creación y no el token interno. Devuelve 201 para una observación nueva y 200 para un replay.",
        operationId: "registerTrackingObservation",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TrackingId" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TrackingObservationRequest"
              }
            }
          }
        },
        responses: {
          201: {
            description: "Observación aceptada.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TrackingObservationResponse"
                }
              }
            }
          },
          200: {
            description: "Observación repetida (replay idempotente).",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TrackingObservationResponse"
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: {
            description:
              "Credencial de sesión inválida, cerrada o inexistente (incluye WWW-Authenticate).",
            headers: {
              "WWW-Authenticate": {
                description: "Esquema de autenticación exigido por el GPS.",
                schema: { type: "string", example: "Bearer" }
              }
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: {
            description:
              "Conflicto de secuencia o una observación obsoleta.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          413: {
            description: "La observación supera el tamaño máximo permitido.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          415: {
            description: "El contenido no es application/json.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          422: { $ref: "#/components/responses/UnprocessableEntity" },
          502: { $ref: "#/components/responses/UpstreamError" },
          503: {
            description:
              "Almacenamiento GPS no disponible temporalmente (incluye Retry-After).",
            headers: {
              "Retry-After": {
                description: "Segundos recomendados antes de reintentar.",
                schema: { type: "string", example: "1" }
              }
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/tracking-sessions/{trackingId}/disable": {
      patch: {
        tags: ["Tracking"],
        summary: "Deshabilitar una sesión de seguimiento",
        operationId: "disableTrackingSession",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TrackingId" }
        ],
        responses: {
          200: {
            description: "Sesión deshabilitada.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TrackingSessionStatusResponse"
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    },
    "/tracking-sessions/{trackingId}/finish": {
      post: {
        tags: ["Tracking"],
        summary: "Finalizar una sesión de seguimiento",
        description:
          "El servicio Go rechaza cualquier cuerpo; el gateway no envía ninguno.",
        operationId: "finishTrackingSession",
        security: [],
        parameters: [
          { $ref: "#/components/parameters/CorrelationId" },
          { $ref: "#/components/parameters/TrackingId" }
        ],
        responses: {
          200: {
            description: "Sesión finalizada.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TrackingSessionStatusResponse"
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamTimeout" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Token JWT obtenido en POST /auth/login. Se reenvía al microservicio correspondiente en el header Authorization."
      }
    },
    parameters: {
      CorrelationId: {
        name: "x-correlation-id",
        in: "header",
        required: false,
        description:
          "Identificador de correlación de la petición. Si no se envía o no es válido, el gateway genera uno nuevo y lo devuelve en la respuesta.",
        schema: { type: "string", maxLength: 128 }
      },
      Page: {
        name: "page",
        in: "query",
        required: false,
        description: "Número de página, base 0.",
        schema: { type: "integer", minimum: 0, default: 0 }
      },
      Size: {
        name: "size",
        in: "query",
        required: false,
        description: "Cantidad de elementos por página.",
        schema: { type: "integer", minimum: 1, maximum: 200, default: 20 }
      },
      Sort: {
        name: "sort",
        in: "query",
        required: false,
        description:
          "Criterio de ordenación en formato propiedad,dirección. Se puede repetir para ordenar por varias propiedades.",
        schema: { type: "string" },
        example: "name,asc"
      },
      GuideId: {
        name: "id",
        in: "path",
        required: true,
        description: "Identificador del guía (userId).",
        schema: { type: "integer", format: "int64", minimum: 1 }
      },
      StudentId: {
        name: "id",
        in: "path",
        required: true,
        description: "Identificador del estudiante (userId).",
        schema: { type: "integer", format: "int64", minimum: 1 }
      },
      SchoolId: {
        name: "schoolId",
        in: "path",
        required: true,
        description: "Identificador del colegio.",
        schema: { type: "integer", format: "int64", minimum: 1 }
      },
      RouteId: {
        name: "id",
        in: "path",
        required: true,
        description:
          "ObjectId de MongoDB de la ruta. Debe ser una cadena hexadecimal de 24 caracteres.",
        schema: { type: "string", maxLength: 128 },
        example: "64b7f0c2e1a2b3c4d5e6f7a8"
      },
      RouteCode: {
        name: "code",
        in: "query",
        required: true,
        description: "Código de la ruta.",
        schema: { type: "string" },
        example: "541"
      },
      RouteCodeAlternative: {
        name: "route_code",
        in: "query",
        required: true,
        description: "Código alternativo de la ruta usado por el servicio de paths.",
        schema: { type: "string" },
        example: "R-541"
      },
      DocumentType: {
        name: "type",
        in: "query",
        required: true,
        description: "Tipo de documento de la persona.",
        schema: { $ref: "#/components/schemas/DocumentType" }
      },
      DocumentNumber: {
        name: "number",
        in: "query",
        required: true,
        description: "Número de documento de la persona.",
        schema: { type: "string" },
        example: "1020304050"
      },
      TripId: {
        name: "tripId",
        in: "path",
        required: true,
        description: "Identificador numérico del viaje.",
        schema: { type: "integer", format: "int64", minimum: 1 },
        example: 12
      },
      TripGuideId: {
        name: "tripGuideId",
        in: "path",
        required: true,
        description: "Identificador numérico del guía dentro del viaje.",
        schema: { type: "integer", format: "int64", minimum: 1 },
        example: 7
      },
      AttendanceStudentId: {
        name: "studentId",
        in: "path",
        required: true,
        description: "Identificador numérico del estudiante.",
        schema: { type: "integer", format: "int64", minimum: 1 },
        example: 42
      },
      OperationRouteId: {
        name: "routeId",
        in: "path",
        required: true,
        description: "Identificador numérico de la ruta administrativa.",
        schema: { type: "integer", format: "int64", minimum: 1 },
        example: 3
      },
      TripDate: {
        name: "date",
        in: "query",
        required: true,
        description: "Fecha del viaje en formato ISO 8601 (YYYY-MM-DD).",
        schema: { type: "string", format: "date" },
        example: "2026-11-17"
      },
      GuideIdPath: {
        name: "guideId",
        in: "path",
        required: true,
        description: "Identificador numérico del guía.",
        schema: { type: "integer", format: "int64", minimum: 1 },
        example: 21
      },
      CycleId: {
        name: "cycleId",
        in: "path",
        required: true,
        description: "Identificador numérico del ciclo de faltas.",
        schema: { type: "integer", format: "int64", minimum: 1 },
        example: 5
      },
      MajorFaultId: {
        name: "majorFaultId",
        in: "path",
        required: true,
        description: "Identificador numérico de la falta grave.",
        schema: { type: "integer", format: "int64", minimum: 1 },
        example: 9
      },
      MinorFaultId: {
        name: "minorFaultId",
        in: "path",
        required: true,
        description: "Identificador numérico de la falta leve.",
        schema: { type: "integer", format: "int64", minimum: 1 },
        example: 10
      },
      AdminId: {
        name: "id",
        in: "path",
        required: true,
        description: "Identificador numérico del recurso administrativo.",
        schema: { type: "integer", format: "int64", minimum: 1 },
        example: 1
      },
      AdminRouteId: {
        name: "routeId",
        in: "path",
        required: true,
        description: "Identificador numérico de la ruta administrativa.",
        schema: { type: "integer", format: "int64", minimum: 1 },
        example: 3
      },
      AdminSchoolIdQuery: {
        name: "schoolId",
        in: "query",
        required: false,
        description: "Filtra las rutas por colegio.",
        schema: { type: "integer", format: "int64", minimum: 1 }
      },
      AdminZone: {
        name: "zone",
        in: "query",
        required: false,
        description: "Filtra por zona geográfica.",
        schema: { type: "string" },
        example: "NORTE"
      },
      Shift: {
        name: "shift",
        in: "query",
        required: true,
        description: "Jornada del llamado a lista.",
        schema: { type: "string" },
        example: "MAÑANA"
      },
      TrackingId: {
        name: "trackingId",
        in: "path",
        required: true,
        description:
          "Identificador opaco emitido por el servicio Go (base64url de 32 caracteres, hasta 256 bytes). El gateway no exige formato UUID.",
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 256,
          example: "3q2-7wV1z8Yk0pQr5sT6uA7bC8dE9fG0h"
        }
      },
      IdempotencyKey: {
        name: "Idempotency-Key",
        in: "header",
        required: true,
        description:
          "Clave de idempotencia de hasta 256 bytes. Obligatoria para crear una sesión de seguimiento.",
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 256,
          example: "trip-12-2026-11-17"
        }
      },
      AfterSequence: {
        name: "after_sequence",
        in: "query",
        required: false,
        description: "Devuelve posiciones con secuencia estrictamente mayor.",
        schema: {
          type: "integer",
          format: "int64",
          minimum: 0,
          maximum: 9007199254740991,
          default: 0
        }
      },
      PositionsLimit: {
        name: "limit",
        in: "query",
        required: false,
        description:
          "Cantidad máxima de posiciones. El servicio Go usa 50 por defecto y admite hasta 100.",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 50
        }
      }
    },
    responses: {
      BadRequest: {
        description:
          "La solicitud no cumple el contrato del gateway o del microservicio.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      Unauthorized: {
        description:
          "Credenciales inválidas o token ausente, vencido o no válido.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      Forbidden: {
        description: "El usuario autenticado no tiene permisos para la operación.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      NotFound: {
        description: "El recurso solicitado no existe.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      Conflict: {
        description:
          "La operación entra en conflicto con el estado actual del recurso (por ejemplo, un documento o correo duplicado).",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      UnprocessableEntity: {
        description:
          "El microservicio no pudo procesar los datos: parámetros obligatorios ausentes, identificador inválido o asociación geográfica inconsistente.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      UpstreamError: {
        description:
          "Fallo al comunicarse con el microservicio: error de red, servicio no disponible o respuesta 5xx del upstream.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      UpstreamTimeout: {
        description:
          "El microservicio no respondió dentro del tiempo de espera configurado.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      }
    },
    schemas: {
      HealthResponse: {
        type: "object",
        required: ["status", "service", "message"],
        properties: {
          status: {
            type: "string",
            example: "UP"
          },
          service: {
            type: "string",
            example: "api-gateway"
          },
          message: {
            type: "string",
            example: "API Gateway funcionando correctamente"
          }
        }
      },
      DocumentType: {
        type: "string",
        description: "Tipo de documento de identidad.",
        enum: ["CC", "CE", "NUIP", "PPT", "PPE"]
      },
      Role: {
        type: "string",
        description: "Rol del usuario en el sistema.",
        enum: ["GUIDE", "LEADER", "MANAGER", "STUDENT", "GUARDIAN"]
      },
      Relationship: {
        type: "string",
        description: "Parentesco del acudiente con el estudiante.",
        enum: ["FATHER", "MOTHER", "UNCLE_AUNT", "RELATIVE", "NEIGHBOR"]
      },
      LoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: {
            type: "string",
            maxLength: 128,
            example: "manager"
          },
          password: {
            type: "string",
            maxLength: 256,
            format: "password",
            example: "synthetic-password"
          }
        }
      },
      LoginResponse: {
        type: "object",
        required: ["token", "user"],
        properties: {
          token: {
            type: "string",
            description: "Token JWT para autenticar las siguientes peticiones.",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          },
          user: {
            type: "object",
            required: ["id", "role"],
            properties: {
              id: {
                type: "integer",
                format: "int64",
                example: 1
              },
              role: { $ref: "#/components/schemas/Role" }
            }
          }
        }
      },
      UserRegistration: {
        type: "object",
        required: [
          "documentType",
          "documentNumber",
          "name",
          "address",
          "phone",
          "role"
        ],
        properties: {
          documentType: { $ref: "#/components/schemas/DocumentType" },
          documentNumber: {
            type: "string",
            maxLength: 20,
            example: "1020304050"
          },
          name: {
            type: "string",
            maxLength: 150,
            example: "Ana María Rodríguez"
          },
          address: {
            type: "string",
            maxLength: 200,
            example: "Calle 45 # 12-30"
          },
          phone: {
            type: "string",
            maxLength: 25,
            example: "3001234567"
          },
          role: { $ref: "#/components/schemas/Role" }
        }
      },
      GuideRegistration: {
        type: "object",
        required: ["contractNumber", "email", "zone"],
        properties: {
          contractNumber: {
            type: "string",
            maxLength: 45,
            example: "CT-2026-001"
          },
          email: {
            type: "string",
            format: "email",
            maxLength: 45,
            example: "ana.rodriguez@example.com"
          },
          zone: {
            type: "string",
            maxLength: 45,
            example: "Zona Norte"
          }
        }
      },
      GuideRequest: {
        type: "object",
        required: ["user", "guide"],
        properties: {
          user: {
            allOf: [{ $ref: "#/components/schemas/UserRegistration" }],
            description: "Datos del usuario. El rol debe ser GUIDE."
          },
          guide: { $ref: "#/components/schemas/GuideRegistration" }
        }
      },
      GuideDetail: {
        type: "object",
        required: [
          "guideId",
          "documentType",
          "documentNumber",
          "name",
          "address",
          "phone",
          "contractNumber",
          "email",
          "zone"
        ],
        properties: {
          guideId: { type: "integer", format: "int64", example: 10 },
          documentType: { $ref: "#/components/schemas/DocumentType" },
          documentNumber: { type: "string", example: "1020304050" },
          name: { type: "string", example: "Ana María Rodríguez" },
          role: {
            type: "string",
            description:
              "Rol del guía. Algunas versiones del servicio lo serializan como Role.",
            example: "GUIDE"
          },
          address: { type: "string", example: "Calle 45 # 12-30" },
          phone: { type: "string", example: "3001234567" },
          contractNumber: { type: "string", example: "CT-2026-001" },
          email: {
            type: "string",
            example: "ana.rodriguez@example.com"
          },
          zone: { type: "string", example: "Zona Norte" }
        }
      },
      Guide: {
        type: "object",
        required: [
          "userId",
          "documentType",
          "documentNumber",
          "name",
          "address",
          "phone",
          "role",
          "active",
          "contractNumber",
          "email",
          "zone"
        ],
        properties: {
          userId: { type: "integer", format: "int64", example: 10 },
          documentType: { $ref: "#/components/schemas/DocumentType" },
          documentNumber: { type: "string", example: "1020304050" },
          name: { type: "string", example: "Ana María Rodríguez" },
          address: { type: "string", example: "Calle 45 # 12-30" },
          phone: { type: "string", example: "3001234567" },
          role: { $ref: "#/components/schemas/Role" },
          active: { type: "boolean", example: true },
          contractNumber: { type: "string", example: "CT-2026-001" },
          email: {
            type: "string",
            example: "ana.rodriguez@example.com"
          },
          zone: { type: "string", example: "Zona Norte" }
        }
      },
      StudentRegistration: {
        type: "object",
        required: ["grade", "schoolShift", "section", "schoolId"],
        properties: {
          grade: { type: "string", maxLength: 20, example: "5" },
          schoolShift: {
            type: "string",
            maxLength: 15,
            example: "MAÑANA"
          },
          section: { type: "string", maxLength: 15, example: "A" },
          schoolId: {
            type: "integer",
            format: "int64",
            minimum: 1,
            example: 12
          }
        }
      },
      StudentRequest: {
        type: "object",
        required: ["user", "student"],
        properties: {
          user: {
            allOf: [{ $ref: "#/components/schemas/UserRegistration" }],
            description: "Datos del usuario. El rol debe ser STUDENT."
          },
          student: { $ref: "#/components/schemas/StudentRegistration" }
        }
      },
      Student: {
        type: "object",
        required: [
          "userId",
          "documentType",
          "documentNumber",
          "name",
          "address",
          "phone",
          "role",
          "active",
          "grade",
          "schoolShift",
          "section",
          "schoolId"
        ],
        properties: {
          userId: { type: "integer", format: "int64", example: 25 },
          documentType: { $ref: "#/components/schemas/DocumentType" },
          documentNumber: { type: "string", example: "1098765432" },
          name: { type: "string", example: "Juan Pérez" },
          address: { type: "string", example: "Carrera 8 # 20-15" },
          phone: { type: "string", example: "3109876543" },
          role: { $ref: "#/components/schemas/Role" },
          active: { type: "boolean", example: true },
          grade: { type: "string", example: "5" },
          schoolShift: { type: "string", example: "MAÑANA" },
          section: { type: "string", example: "A" },
          schoolId: {
            type: "integer",
            format: "int64",
            example: 12
          },
          guardians: {
            type: "array",
            description:
              "Acudientes asociados. Puede no estar presente en todas las versiones del servicio.",
            items: {
              type: "object",
              additionalProperties: true
            }
          }
        }
      },
      StudentDetail: {
        type: "object",
        required: [
          "userId",
          "documentType",
          "documentNumber",
          "name",
          "address",
          "phone",
          "grade",
          "schoolShift",
          "section",
          "schoolId"
        ],
        properties: {
          userId: { type: "integer", format: "int64", example: 25 },
          documentType: { $ref: "#/components/schemas/DocumentType" },
          documentNumber: { type: "string", example: "1098765432" },
          name: { type: "string", example: "Juan Pérez" },
          address: { type: "string", example: "Carrera 8 # 20-15" },
          phone: { type: "string", example: "3109876543" },
          grade: { type: "string", example: "5" },
          schoolShift: { type: "string", example: "MAÑANA" },
          section: { type: "string", example: "A" },
          schoolId: {
            type: "integer",
            format: "int64",
            nullable: true,
            example: 12
          },
          guardians: {
            type: "array",
            items: { $ref: "#/components/schemas/GuardianDetail" }
          }
        }
      },
      GuardianDetail: {
        type: "object",
        required: ["userId", "name", "relationship", "isPrimary"],
        properties: {
          userId: { type: "integer", format: "int64", example: 40 },
          name: { type: "string", example: "María Pérez" },
          phone: { type: "string", nullable: true, example: "3001234567" },
          relationship: { $ref: "#/components/schemas/Relationship" },
          isPrimary: { type: "boolean", example: true }
        }
      },
      AssignGuardianRequest: {
        type: "object",
        required: ["guardianId", "relationship", "isPrimary"],
        properties: {
          guardianId: {
            type: "integer",
            format: "int64",
            minimum: 1,
            example: 40
          },
          relationship: { $ref: "#/components/schemas/Relationship" },
          isPrimary: {
            type: "boolean",
            description: "Indica si es el acudiente principal.",
            example: true
          }
        }
      },
      UserSummary: {
        type: "object",
        required: [
          "userId",
          "documentType",
          "documentNumber",
          "name",
          "phone",
          "role",
          "active"
        ],
        properties: {
          userId: { type: "integer", format: "int64", example: 40 },
          documentType: { $ref: "#/components/schemas/DocumentType" },
          documentNumber: { type: "string", example: "1020304050" },
          name: { type: "string", example: "María Pérez" },
          phone: { type: "string", example: "3001234567" },
          role: { $ref: "#/components/schemas/Role" },
          active: { type: "boolean", example: true }
        }
      },
      PersonSearchResult: {
        description:
          "Resultado de la búsqueda. Es un estudiante, un guía o un resumen de usuario según el rol.",
        oneOf: [
          { $ref: "#/components/schemas/StudentDetail" },
          { $ref: "#/components/schemas/GuideDetail" },
          { $ref: "#/components/schemas/UserSummary" }
        ]
      },
      PageMetadata: {
        type: "object",
        properties: {
          totalElements: { type: "integer", minimum: 0, example: 42 },
          totalPages: { type: "integer", minimum: 0, example: 3 },
          size: { type: "integer", minimum: 0, example: 20 },
          number: { type: "integer", minimum: 0, example: 0 },
          numberOfElements: { type: "integer", minimum: 0, example: 20 },
          first: { type: "boolean", example: true },
          last: { type: "boolean", example: false },
          empty: { type: "boolean", example: false },
          sort: { type: "object", additionalProperties: true },
          pageable: { type: "object", additionalProperties: true }
        }
      },
      GuidePage: {
        allOf: [
          { $ref: "#/components/schemas/PageMetadata" },
          {
            type: "object",
            required: ["content"],
            properties: {
              content: {
                type: "array",
                items: { $ref: "#/components/schemas/GuideDetail" }
              }
            }
          }
        ]
      },
      StudentPage: {
        allOf: [
          { $ref: "#/components/schemas/PageMetadata" },
          {
            type: "object",
            required: ["content"],
            properties: {
              content: {
                type: "array",
                items: { $ref: "#/components/schemas/StudentDetail" }
              }
            }
          }
        ]
      },
      GeoPoint: {
        type: "object",
        required: ["type", "coordinates"],
        properties: {
          type: { type: "string", enum: ["Point"] },
          coordinates: {
            type: "array",
            description: "Longitud y latitud en ese orden.",
            minItems: 2,
            maxItems: 2,
            items: { type: "number" }
          }
        }
      },
      GeoLineString: {
        type: "object",
        required: ["type", "coordinates"],
        properties: {
          type: { type: "string", enum: ["LineString"] },
          coordinates: {
            type: "array",
            description: "Secuencia de pares longitud/latitud.",
            minItems: 2,
            items: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "number" }
            }
          }
        }
      },
      GeoRoute: {
        type: "object",
        required: ["_id", "name"],
        additionalProperties: true,
        properties: {
          _id: {
            type: "string",
            example: "64b7f0c2e1a2b3c4d5e6f7a8"
          },
          name: { type: "string", example: "Ruta 541 - Colegio Distrital" },
          route_code: {
            type: "string",
            nullable: true,
            example: "R-541"
          },
          code: { type: "string", nullable: true, example: "541" },
          day_shift: {
            type: "string",
            nullable: true,
            example: "MAÑANA"
          },
          endpoint_status: {
            type: "string",
            example: "resolved"
          },
          endpoint_reason: {
            type: "string",
            nullable: true,
            example: "endpoints_found"
          },
          geometry: { $ref: "#/components/schemas/GeoLineString" },
          meeting_point_ids: {
            type: "array",
            items: { type: "string" }
          },
          start_meeting_point_id: {
            type: "string",
            nullable: true
          },
          end_meeting_point_id: {
            type: "string",
            nullable: true
          },
          first_meeting_point_id: {
            type: "string",
            nullable: true
          },
          endpoints: {
            type: "object",
            description: "Metadatos de resolución de los puntos extremos.",
            additionalProperties: true
          }
        }
      },
      GeoRouteDetail: {
        allOf: [
          { $ref: "#/components/schemas/GeoRoute" },
          {
            type: "object",
            properties: {
              meeting_points: {
                type: "array",
                items: { $ref: "#/components/schemas/MeetingPoint" }
              }
            }
          }
        ]
      },
      MeetingPoint: {
        type: "object",
        required: ["_id", "name", "kind", "location"],
        additionalProperties: true,
        properties: {
          _id: {
            type: "string",
            example: "64b7f0c2e1a2b3c4d5e6f7a9"
          },
          name: { type: "string", example: "Parque Principal" },
          kind: { type: "string", example: "meeting_point" },
          description: {
            type: "string",
            nullable: true,
            example: "Esquina norte del parque"
          },
          location: { $ref: "#/components/schemas/GeoPoint" }
        }
      },
      FirstMeetingPoint: {
        type: "object",
        required: [
          "route_id",
          "meeting_point_id",
          "name",
          "longitude",
          "latitude"
        ],
        properties: {
          route_id: { type: "string", example: "64b7f0c2e1a2b3c4d5e6f7a8" },
          meeting_point_id: {
            type: "string",
            example: "64b7f0c2e1a2b3c4d5e6f7a9"
          },
          name: { type: "string", example: "Parque Principal" },
          longitude: { type: "number", example: -74.0721 },
          latitude: { type: "number", example: 4.711 }
        }
      },
      RouteEndpointPoint: {
        type: "object",
        required: ["meeting_point_id", "name", "longitude", "latitude"],
        properties: {
          meeting_point_id: {
            type: "string",
            example: "64b7f0c2e1a2b3c4d5e6f7a9"
          },
          name: { type: "string", example: "Parque Principal" },
          longitude: { type: "number", example: -74.0721 },
          latitude: { type: "number", example: 4.711 },
          source: { type: "string", nullable: true, example: "folder" },
          distance_m: {
            type: "number",
            nullable: true,
            example: 12.5
          }
        }
      },
      RouteEndpointsView: {
        type: "object",
        required: ["route_id", "status"],
        properties: {
          route_id: { type: "string", example: "64b7f0c2e1a2b3c4d5e6f7a8" },
          status: { type: "string", example: "resolved" },
          start: {
            allOf: [{ $ref: "#/components/schemas/RouteEndpointPoint" }],
            nullable: true
          },
          end: {
            allOf: [{ $ref: "#/components/schemas/RouteEndpointPoint" }],
            nullable: true
          }
        }
      },
      RouteOverview: {
        type: "object",
        required: ["route", "firstMeetingPoint", "endpoints"],
        properties: {
          route: { $ref: "#/components/schemas/GeoRouteDetail" },
          firstMeetingPoint: {
            $ref: "#/components/schemas/FirstMeetingPoint"
          },
          endpoints: { $ref: "#/components/schemas/RouteEndpointsView" }
        }
      },
      RouteImportResult: {
        type: "object",
        required: ["message", "saved_routes", "saved_points"],
        properties: {
          message: {
            type: "string",
            example: "File processed successfully"
          },
          saved_routes: {
            type: "integer",
            minimum: 0,
            example: 12
          },
          saved_points: {
            type: "integer",
            minimum: 0,
            example: 48
          },
          endpoints: {
            type: "object",
            properties: {
              resolved: { type: "integer", minimum: 0, example: 10 },
              unresolved: { type: "integer", minimum: 0, example: 1 },
              not_applicable: { type: "integer", minimum: 0, example: 1 }
            }
          }
        }
      },
      StatusNotifyRequest: {
        type: "object",
        description: "Notificación de estado operativo de una ruta.",
        additionalProperties: true,
        properties: {
          route_id: { type: "string", example: "64b7f0c2e1a2b3c4d5e6f7a8" },
          status: { type: "string", example: "active" },
          reason: { type: "string", nullable: true }
        }
      },
      StatusNotifyResponse: {
        type: "object",
        additionalProperties: true,
        properties: {
          route_id: { type: "string", example: "64b7f0c2e1a2b3c4d5e6f7a8" },
          status: { type: "string", example: "active" },
          notified_at: {
            type: "string",
            format: "date-time",
            nullable: true
          }
        }
      },
      GeographicValidationRequest: {
        type: "object",
        required: ["latitude", "longitude"],
        properties: {
          latitude: { type: "number", minimum: -90, maximum: 90, example: 4.711 },
          longitude: {
            type: "number",
            minimum: -180,
            maximum: 180,
            example: -74.0721
          },
          accuracy_m: {
            type: "number",
            minimum: 0,
            nullable: true,
            example: 12.5
          },
          captured_at: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: "2026-11-17T11:30:00Z"
          }
        }
      },
      GeographicValidation: {
        type: "object",
        additionalProperties: true,
        properties: {
          route_id: { type: "string", example: "64b7f0c2e1a2b3c4d5e6f7a8" },
          meeting_point_id: {
            type: "string",
            example: "64b7f0c2e1a2b3c4d5e6f7a9"
          },
          status: {
            type: "string",
            example: "inside",
            description: "Resultado de la validación geográfica."
          },
          distance_m: { type: "number", nullable: true, example: 18.4 }
        }
      },
      TripRequest: {
        type: "object",
        required: ["routeId", "tripDate"],
        properties: {
          routeId: { type: "integer", format: "int64", minimum: 1 },
          routeCode: { type: "string", maxLength: 4, example: "541" },
          shiftCode: { type: "string", example: "541" },
          tripDate: { type: "string", format: "date", example: "2026-11-17" },
          schoolName: { type: "string", example: "Colegio Distrital" },
          scheduledStart: {
            type: "string",
            example: "06:30:00",
            description: "Hora local programada de inicio."
          },
          startPointId: { type: "integer", format: "int64", nullable: true },
          startPointCode: { type: "string", nullable: true },
          mainGuideId: { type: "integer", format: "int64", nullable: true },
          mainGuideName: { type: "string", nullable: true },
          supportGuideId: { type: "integer", format: "int64", nullable: true },
          supportGuideName: { type: "string", nullable: true }
        }
      },
      Trip: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 12 },
          routeId: { type: "integer", format: "int64", example: 3 },
          tripDate: { type: "string", format: "date", example: "2026-11-17" },
          status: { type: "string", example: "IN_PROGRESS" },
          startedAt: { type: "string", format: "date-time", nullable: true },
          finishedAt: { type: "string", format: "date-time", nullable: true }
        }
      },
      TripGuide: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 7 },
          tripId: { type: "integer", format: "int64", example: 12 },
          guideId: { type: "integer", format: "int64", example: 21 },
          guideName: { type: "string", example: "Ana Pérez" },
          primary: { type: "boolean", example: true },
          status: { type: "string", example: "ASSIGNED" }
        }
      },
      TripGuideReplacementRequest: {
        type: "object",
        required: ["replacementGuideId"],
        properties: {
          replacementGuideId: { type: "integer", format: "int64", minimum: 1 },
          replacementGuideName: { type: "string", maxLength: 150 },
          reason: { type: "string", maxLength: 500 }
        }
      },
      TripLifecycleRequest: {
        type: "object",
        properties: {
          occurredAt: {
            type: "string",
            format: "date-time",
            example: "2026-11-17T11:30:00-05:00"
          }
        }
      },
      TripEventRequest: {
        type: "object",
        required: ["operationCode", "occurredAt"],
        properties: {
          operationCode: { type: "string", example: "START" },
          occurredAt: { type: "string", format: "date-time" },
          description: { type: "string", nullable: true },
          latitude: { type: "number", nullable: true, example: 4.711 },
          longitude: { type: "number", nullable: true, example: -74.0721 },
          source: { type: "string", nullable: true, example: "GUIDE" },
          sourceEventId: { type: "string", nullable: true }
        }
      },
      TripEvent: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 31 },
          tripId: { type: "integer", format: "int64", example: 12 },
          operationCode: { type: "string", example: "START" },
          occurredAt: { type: "string", format: "date-time" },
          reporterType: { type: "string", example: "GUIDE" }
        }
      },
      AttendanceRosterEntry: {
        type: "object",
        required: ["studentId", "studentName"],
        properties: {
          studentId: { type: "integer", format: "int64", minimum: 1 },
          studentName: { type: "string", maxLength: 150 }
        }
      },
      AttendanceCommand: {
        type: "object",
        required: ["statusCode"],
        properties: {
          studentNameSnapshot: { type: "string", maxLength: 150 },
          statusCode: { type: "string", example: "PRESENT" },
          note: { type: "string", nullable: true },
          accompanyingPersonName: { type: "string", nullable: true },
          accompanyingPersonRelation: { type: "string", nullable: true }
        }
      },
      StudentAttendance: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 44 },
          tripId: { type: "integer", format: "int64", example: 12 },
          studentId: { type: "integer", format: "int64", example: 42 },
          statusCode: { type: "string", example: "PRESENT" },
          registeredAt: { type: "string", format: "date-time", nullable: true }
        }
      },
      GuideCheckInAttempt: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 81 },
          tripGuideId: { type: "integer", format: "int64", example: 7 },
          result: { type: "string", example: "ACCEPTED" },
          attemptedAt: { type: "string", format: "date-time" }
        }
      },
      GuideFaultCycle: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 5 },
          guideId: { type: "integer", format: "int64", example: 21 },
          status: { type: "string", example: "OPEN" },
          startedAt: { type: "string", format: "date-time" }
        }
      },
      MinorFault: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 10 },
          cycleId: { type: "integer", format: "int64", example: 5 },
          notified: { type: "boolean", example: false },
          occurredAt: { type: "string", format: "date-time" }
        }
      },
      MajorFault: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 9 },
          guideId: { type: "integer", format: "int64", example: 21 },
          notified: { type: "boolean", example: false },
          minuted: { type: "boolean", example: false },
          occurredAt: { type: "string", format: "date-time" }
        }
      },
      TripOverview: {
        type: "object",
        required: ["trip", "guides", "attendance", "events"],
        properties: {
          trip: { $ref: "#/components/schemas/Trip" },
          guides: {
            type: "array",
            items: { $ref: "#/components/schemas/TripGuide" }
          },
          attendance: {
            type: "array",
            items: { $ref: "#/components/schemas/StudentAttendance" }
          },
          events: {
            type: "array",
            items: { $ref: "#/components/schemas/TripEvent" }
          }
        }
      },
      AdminRouteRequest: {
        type: "object",
        required: ["routeCode", "shiftCode", "schoolId", "scheduledStartTime"],
        properties: {
          routeCode: { type: "string", maxLength: 4, example: "541" },
          shiftCode: {
            type: "string",
            enum: ["541", "542"],
            example: "541"
          },
          description: { type: "string", maxLength: 2000, nullable: true },
          schoolId: { type: "integer", format: "int64", minimum: 1 },
          scheduledStartTime: {
            type: "string",
            example: "06:30:00",
            description: "Hora local programada (LocalTime)."
          }
        }
      },
      AdminRoute: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 3 },
          routeCode: { type: "string", example: "541" },
          shiftCode: { type: "string", example: "541" },
          schoolId: { type: "integer", format: "int64", example: 2 },
          active: { type: "boolean", example: true }
        }
      },
      AdminRouteOverview: {
        type: "object",
        required: ["route", "meetingPoints", "students"],
        properties: {
          route: { $ref: "#/components/schemas/AdminRoute" },
          meetingPoints: {
            type: "array",
            items: { $ref: "#/components/schemas/AdminMeetingPoint" }
          },
          students: {
            type: "array",
            items: { $ref: "#/components/schemas/AdminStudent" }
          }
        }
      },
      AssignGuidesToRouteRequest: {
        type: "object",
        required: ["guides"],
        properties: {
          guides: {
            type: "array",
            minItems: 1,
            maxItems: 2,
            items: {
              type: "object",
              required: ["guideId"],
              properties: {
                guideId: { type: "integer", format: "int64", minimum: 1 },
                name: { type: "string", maxLength: 150 },
                primary: { type: "boolean", example: true }
              }
            }
          }
        }
      },
      AdminMeetingPointRequest: {
        type: "object",
        required: [
          "meetingPointCode",
          "address",
          "latitude",
          "longitude"
        ],
        properties: {
          meetingPointCode: { type: "string", maxLength: 4, example: "P01" },
          address: { type: "string", maxLength: 45 },
          distance: {
            type: "integer",
            minimum: 0,
            nullable: true,
            description: "Distancia en metros desde el inicio de la ruta."
          },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 }
        }
      },
      AdminMeetingPoint: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 8 },
          meetingPointCode: { type: "string", example: "P01" },
          address: { type: "string" },
          distance: { type: "integer", nullable: true },
          latitude: { type: "number" },
          longitude: { type: "number" }
        }
      },
      AdminStudentRequest: {
        type: "object",
        required: ["studentId", "name"],
        properties: {
          studentId: { type: "integer", format: "int64", minimum: 1 },
          name: { type: "string", maxLength: 150 }
        }
      },
      AdminStudentUpdateRequest: {
        type: "object",
        required: ["name", "active"],
        properties: {
          name: { type: "string", maxLength: 150 },
          active: { type: "boolean" }
        }
      },
      AdminStudent: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 42 },
          studentId: { type: "integer", format: "int64", example: 42 },
          name: { type: "string", example: "Juan Pérez" },
          routeId: { type: "integer", format: "int64", nullable: true },
          active: { type: "boolean", example: true }
        }
      },
      StudentMeetingPoint: {
        type: "object",
        additionalProperties: true,
        properties: {
          shiftCode: { type: "string", example: "541" },
          meetingPointId: { type: "integer", format: "int64", example: 8 },
          meetingPointCode: { type: "string", example: "P01" }
        }
      },
      AssignStudentMeetingPointsRequest: {
        type: "object",
        required: ["assignments"],
        properties: {
          assignments: {
            type: "array",
            minItems: 1,
            maxItems: 2,
            items: {
              type: "object",
              required: ["shiftCode", "meetingPointId"],
              properties: {
                shiftCode: {
                  type: "string",
                  enum: ["541", "542"]
                },
                meetingPointId: {
                  type: "integer",
                  format: "int64",
                  minimum: 1
                }
              }
            }
          }
        }
      },
      AdminSchoolRequest: {
        type: "object",
        required: [
          "name",
          "schoolCode",
          "phone",
          "address",
          "zone",
          "latitude",
          "longitude"
        ],
        properties: {
          name: { type: "string", maxLength: 150 },
          schoolCode: { type: "string", maxLength: 45 },
          phone: { type: "string", maxLength: 45 },
          address: { type: "string", maxLength: 200 },
          zone: { type: "string", maxLength: 45 },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 }
        }
      },
      AdminSchool: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "integer", format: "int64", example: 2 },
          name: { type: "string", example: "Colegio Distrital" },
          schoolCode: { type: "string", example: "SCH-01" },
          zone: { type: "string", example: "NORTE" },
          active: { type: "boolean", example: true }
        }
      },
      TrackingSessionCreateRequest: {
        type: "object",
        required: ["trip_id", "guide_id", "geo_route_id", "policy_id"],
        additionalProperties: false,
        properties: {
          trip_id: {
            type: "string",
            description: "Identificador opaco del viaje en operaciones.",
            example: "12"
          },
          guide_id: {
            type: "string",
            description: "Identificador opaco del guía.",
            example: "21"
          },
          geo_route_id: {
            type: "string",
            description: "Identificador de la ruta geográfica.",
            example: "64b7f0c2e1a2b3c4d5e6f7a8"
          },
          policy_id: {
            type: "string",
            description: "Identificador de la política de seguimiento.",
            example: "policy-2026"
          }
        }
      },
      TrackingSessionCreatedResponse: {
        type: "object",
        required: ["tracking_id", "session", "credential_status"],
        properties: {
          tracking_id: {
            type: "string",
            description: "Identificador opaco base64url emitido por el GPS.",
            example: "3q2-7wV1z8Yk0pQr5sT6uA7bC8dE9fG0h"
          },
          session: { $ref: "#/components/schemas/TrackingSession" },
          observation_credential: {
            type: "string",
            nullable: true,
            description:
              "Bearer de sesión para registrar observaciones. Solo se emite al crear la sesión."
          },
          credential_status: {
            type: "string",
            example: "issued"
          }
        }
      },
      TrackingSessionStatusResponse: {
        type: "object",
        required: ["session"],
        properties: {
          session: { $ref: "#/components/schemas/TrackingSession" }
        }
      },
      TrackingSessionControlResponse: {
        type: "object",
        additionalProperties: true,
        description:
          "Vista de control del GPS. Los campos dependen de la política y el snapshot geográfico.",
        properties: {
          session: { $ref: "#/components/schemas/TrackingSession" }
        }
      },
      TrackingSession: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: {
            type: "string",
            example: "3q2-7wV1z8Yk0pQr5sT6uA7bC8dE9fG0h"
          },
          guide_id: { type: "string", example: "21" },
          route_id: { type: "string", example: "64b7f0c2e1a2b3c4d5e6f7a8" },
          trip_id: { type: "string", example: "12" },
          state: { type: "string", enum: ["active", "finished"] },
          started_at: { type: "string", format: "date-time" },
          finished_at: {
            type: "string",
            format: "date-time",
            nullable: true
          },
          last_sequence: { type: "integer", format: "int64", example: 14 },
          last_captured_at: {
            type: "string",
            format: "date-time",
            nullable: true
          }
        }
      },
      TrackingObservationRequest: {
        type: "object",
        required: [
          "sequence",
          "latitude",
          "longitude",
          "accuracy_m",
          "captured_at"
        ],
        additionalProperties: false,
        properties: {
          sequence: { type: "integer", format: "int64", minimum: 1 },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 },
          accuracy_m: { type: "number", minimum: 0 },
          captured_at: {
            type: "string",
            format: "date-time",
            description: "Marca temporal RFC 3339 con nanosegundos opcionales."
          }
        }
      },
      TrackingObservationResponse: {
        type: "object",
        required: [
          "tracking_id",
          "sequence",
          "acceptance",
          "received_at",
          "geographic_evaluation"
        ],
        properties: {
          tracking_id: { type: "string" },
          sequence: { type: "integer", format: "int64", example: 14 },
          acceptance: {
            type: "string",
            enum: ["accepted", "replayed"]
          },
          received_at: { type: "string", format: "date-time" },
          expires_at: {
            type: "string",
            format: "date-time",
            nullable: true
          },
          geographic_evaluation: {
            description:
              "Resultado geográfico del GPS o la cadena not_evaluated.",
            oneOf: [{ type: "string" }, { type: "object" }],
            example: "not_evaluated"
          }
        }
      },
      TrackingPosition: {
        type: "object",
        required: [
          "sequence",
          "latitude",
          "longitude",
          "captured_at",
          "received_at",
          "geographic_evaluation"
        ],
        properties: {
          sequence: { type: "integer", format: "int64", example: 14 },
          latitude: { type: "number", example: 4.711 },
          longitude: { type: "number", example: -74.0721 },
          accuracy_m: { type: "number", nullable: true, example: 12.5 },
          captured_at: { type: "string", format: "date-time" },
          received_at: { type: "string", format: "date-time" },
          geographic_evaluation: {
            oneOf: [{ type: "string" }, { type: "object" }],
            example: "not_evaluated"
          }
        }
      },
      TrackingPositionsResponse: {
        type: "object",
        required: [
          "tracking_id",
          "tracking_state",
          "positions",
          "next_after_sequence",
          "has_more"
        ],
        properties: {
          tracking_id: { type: "string" },
          tracking_state: { type: "string", enum: ["active", "finished"] },
          positions: {
            type: "array",
            items: { $ref: "#/components/schemas/TrackingPosition" }
          },
          next_after_sequence: { type: "integer", format: "int64" },
          has_more: { type: "boolean" }
        }
      },
      TrackingLatestPositionResponse: {
        type: "object",
        required: ["tracking_id", "tracking_state", "position", "age_ms"],
        properties: {
          tracking_id: { type: "string" },
          tracking_state: { type: "string", enum: ["active", "finished"] },
          position: { $ref: "#/components/schemas/TrackingPosition" },
          age_ms: { type: "integer", format: "int64", minimum: 0 }
        }
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "correlationId"],
            properties: {
              code: { type: "string", example: "MS_USERS_404" },
              message: {
                type: "string",
                example: "No se encontró la ruta solicitada."
              },
              correlationId: {
                type: "string",
                example: "6f1a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8"
              },
              service: { type: "string", example: "users" },
              details: {}
            }
          }
        }
      }
    }
  }
};

module.exports = openapi;
