const services = require("./config/services");

services.assertConfigured();

const app = require("./app");
const { createAppServer } = require("./config/appServer");

const PORT = process.env.PORT || 5062;

createAppServer(app).listen(PORT, () => {
  console.log(`API Gateway escuchando en el puerto ${PORT}`);
});
