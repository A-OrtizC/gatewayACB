const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapi = require("../../config/openapi");

const router = express.Router();

router.get("/openapi.json", (req, res) => {
  res.status(200).json(openapi);
});

router.use("/docs", swaggerUi.serve);
router.get(
  "/docs",
  swaggerUi.setup(openapi, {
    customSiteTitle: "API Gateway ACB - Documentación",
    swaggerOptions: {
      persistAuthorization: true
    }
  })
);

module.exports = router;
