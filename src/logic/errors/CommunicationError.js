class CommunicationError extends Error {
  constructor({
    type = "UNKNOWN",
    code = "UNKNOWN",
    message = "Error de comunicación con microservicio",
    service = null,
    status = null,
    details = null,
    durationMs = null,
    correlationId = null,
    raw = null,
  } = {}) {
    super(message);
    this.name = "CommunicationError";
    this.type = type;
    this.code = code;
    this.service = service;
    this.status = status;
    this.details = details;
    this.durationMs = durationMs;
    this.correlationId = correlationId;
    this.raw = raw;
  }
}

module.exports = CommunicationError;
