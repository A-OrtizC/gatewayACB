class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
    this.code = "RESOURCE_NOT_FOUND";
  }
}

module.exports = NotFoundError;
