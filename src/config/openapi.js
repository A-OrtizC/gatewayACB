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
          "Valida que el cuerpo sea un objeto JSON y lo reenvía al endpoint de importación del servicio de paths. El servicio de paths define la importación como una carga multipart de archivo; si el upstream exige ese formato, la petición puede ser rechazada con 422.",
        operationId: "importKmz",
        security: [],
        parameters: [{ $ref: "#/components/parameters/CorrelationId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true
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
          422: { $ref: "#/components/responses/UnprocessableEntity" },
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
