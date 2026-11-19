const services = require("./config/services");

services.assertConfigured();

const app = require("./app");

const PORT = process.env.PORT || 5062;

app.listen(PORT, () => {
  console.log(`API Gateway escuchando en el puerto ${PORT}`);
});
