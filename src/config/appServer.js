const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const tls = require("node:tls");

function tlsOptions() {
  const certFile = process.env.ACB_TLS_CERT_FILE;
  const keyFile = process.env.ACB_TLS_KEY_FILE;
  if (!certFile && !keyFile) return null; // Legacy local HTTP, outside P3 TLS Compose.
  if (!certFile || !keyFile) {
    throw new Error("ACB_TLS_CERT_FILE and ACB_TLS_KEY_FILE are both required");
  }
  const options = {
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(keyFile),
  };
  tls.createSecureContext(options); // Fail before listening when the pair is invalid.
  if (process.env.NODE_EXTRA_CA_CERTS) {
    fs.accessSync(process.env.NODE_EXTRA_CA_CERTS, fs.constants.R_OK);
  }
  return options;
}

function createAppServer(app) {
  const options = tlsOptions();
  return options ? https.createServer(options, app) : http.createServer(app);
}

module.exports = { createAppServer, tlsOptions };
