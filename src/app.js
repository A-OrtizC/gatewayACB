const express = require("express");

const app = express();

// Permite recibir y procesar cuerpos de solicitudes JSON.
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  const docsRoutes = require("./presentation/routes/docs.routes");
  app.use("/", docsRoutes);
}

// Endpoint para verificar que el Gateway está funcionando.
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "api-gateway",
    message: "API Gateway funcionando correctamente"
  });
});

module.exports = app;