const packageJson = require("../../package.json");

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "API Gateway ACB",
    version: packageJson.version,
    description: "Documentación de los endpoints expuestos por el API Gateway."
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
      name: "Routes",
      description: "Consultas y operaciones disponibles para el servicio de rutas"
    }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Verificar el estado del gateway",
        description: "Devuelve el estado operativo del API Gateway.",
        operationId: "getHealth",
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
    "/routes": {
      get: {
        tags: ["Routes"],
        summary: "Listar rutas",
        operationId: "findRoutes",
        parameters: [
          {
            name: "x-correlation-id",
            in: "header",
            required: false,
            schema: { type: "string", maxLength: 128 }
          },
          {
            name: "authorization",
            in: "header",
            required: false,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Listado devuelto por el servicio de rutas.",
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true }
              }
            }
          },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamError" }
        }
      }
    },
    "/routes/search": {
      get: {
        tags: ["Routes"],
        summary: "Buscar rutas",
        operationId: "searchRoutes",
        description:
          "Todos los parámetros de consulta se reenvían al servicio de rutas, por ejemplo ?name=Centro&status=active.",
        responses: {
          200: {
            description: "Resultados de búsqueda.",
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true }
              }
            }
          },
          400: { $ref: "#/components/responses/RequestError" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamError" }
        }
      }
    },
    "/routes/{id}": {
      get: {
        tags: ["Routes"],
        summary: "Consultar una ruta",
        operationId: "getRoute",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", maxLength: 128 }
          }
        ],
        responses: {
          200: {
            description: "Ruta encontrada.",
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true }
              }
            }
          },
          404: { $ref: "#/components/responses/RequestError" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamError" }
        }
      }
    },
    "/routes/{id}/overview": {
      get: {
        tags: ["Routes"],
        summary: "Consultar el resumen de una ruta",
        description: "Combina la ruta, su primer punto de encuentro y sus puntos extremos.",
        operationId: "getRouteOverview",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", maxLength: 128 }
          }
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
          404: { $ref: "#/components/responses/RequestError" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamError" }
        }
      }
    },
    "/routes/{id}/first-meeting-point": {
      get: {
        tags: ["Routes"],
        summary: "Consultar el primer punto de encuentro",
        operationId: "getRouteFirstMeetingPoint",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", maxLength: 128 }
          }
        ],
        responses: {
          200: { description: "Punto de encuentro devuelto por el servicio de rutas." },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamError" }
        }
      }
    },
    "/routes/{id}/endpoints": {
      get: {
        tags: ["Routes"],
        summary: "Consultar los puntos extremos de una ruta",
        operationId: "getRouteEndpoints",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", maxLength: 128 }
          }
        ],
        responses: {
          200: { description: "Puntos extremos devueltos por el servicio de rutas." },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamError" }
        }
      }
    },
    "/routes/imports/kmz": {
      post: {
        tags: ["Routes"],
        summary: "Importar datos KMZ",
        description: "Reenvía el objeto JSON recibido al servicio de rutas para su importación.",
        operationId: "importKmz",
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
          201: { description: "Importación aceptada por el servicio de rutas." },
          400: { $ref: "#/components/responses/RequestError" },
          502: { $ref: "#/components/responses/UpstreamError" },
          504: { $ref: "#/components/responses/UpstreamError" }
        }
      }
    }
  },
  components: {
    responses: {
      RequestError: {
        description: "Solicitud inválida o recurso no encontrado.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      },
      UpstreamError: {
        description: "Fallo al comunicarse con el servicio de rutas.",
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
      RouteOverview: {
        type: "object",
        required: ["route", "firstMeetingPoint", "endpoints"],
        properties: {
          route: { type: "object", additionalProperties: true },
          firstMeetingPoint: {},
          endpoints: {}
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
              code: { type: "string" },
              message: { type: "string" },
              correlationId: { type: "string" },
              service: { type: "string" },
              details: {}
            }
          }
        }
      }
    }
  }
};

module.exports = openapi;
