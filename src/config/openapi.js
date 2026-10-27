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
    }
  },
  components: {
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
      }
    }
  }
};

module.exports = openapi;
