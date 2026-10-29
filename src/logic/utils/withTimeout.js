function withTimeout(promise, ms, { label = "orquestador" } = {}) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Timeout total del caso de uso: ${label} (${ms}ms)`);
      err.name = "OrchestratorTimeoutError";
      err.code = "ORCHESTRATOR_TIMEOUT";
      err.timeoutMs = ms;
      err.label = label;
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

module.exports = { withTimeout };
