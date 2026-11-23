const cluster = require('node:cluster');
const os = require('node:os');
const { ClusterMemoryStorePrimary } = require('@express-rate-limit/cluster-memory-store');
const services = require('./config/services');
services.assertConfigured();
const app = require('./app');
const { createAppServer, tlsOptions } = require('./config/appServer');
const PORT = process.env.PORT || 5062;

// Validate the mounted pair in the primary process before forking workers.
tlsOptions();

// Solo crear workers en modo producción o cuando se especifique CLUSTER_ENABLED=true
if (cluster.isPrimary) {
  console.log(`[${process.pid}] Procesador principal - Inicio de la aplicación`);

  // Contadores de rate limiting compartidos por todos los workers.
  new ClusterMemoryStorePrimary().init();
  
  // Determinar el número de workers (núcleos disponibles)
  const numCPUs = os.cpus().length;
  // const numCPUs = Math.max(1, Math.floor(os.cpus().length));
  console.log(`[${process.pid}] CPU disponible: ${numCPUs}`);

  // Opcional: limitadores para no saturar todos los núcleos
  // const numWorkers = process.env.MAX_WORKERS ? parseInt(process.env.MAX_WORKERS) : numCPUs;
  const numWorkers = numCPUs;

  console.log(`[${process.pid}] Iniciando ${numWorkers} workers`);

  // Crear workers
  for (let i = 0; i < numWorkers; i++) {
    const worker = cluster.fork();
    console.log(`[${process.pid}] Worker ${i} creado (PID: ${worker.pid})`);
    
    worker.on('online', (event) => {
      console.log(`[${process.pid}] Worker ${worker.pid} está en línea - evento '${event}'`);
    });

    worker.on('exit', (code, signal) => {
      console.log(`[${process.pid}] Worker ${worker.pid} exited con código ${code}, señal ${signal}`);
      
      // Crear un nuevo worker para reemplazar el que falle
      if (cluster.isPrimary) {
        const newWorker = cluster.fork();
        console.log(`[${process.pid}] Re-creando worker: ${newWorker?.pid}`);
      }
    });

    worker.on('error', (err) => {
      console.error(`[${process.pid}] Worker ${worker.pid} error:`, err);
    });
  }

  // Manejador de signals para reiniciar todos los workers
  cluster.on('exit', (_worker, code) => {
    if (code === -1) {
      // Reiniciar worker
      console.log(`[${process.pid}] Worker exited - creando uno nuevo`);
      const newWorker = cluster.fork();
      return;
    }

    if (code !== null && process.env.NODE_ENV !== 'production') {
      // En desarrollo, reiniciar todos los workers si uno falla
      console.log(`[${process.pid}] Reiniciando todos los workers`);
      Object.values(cluster.workers).forEach(w => {
        w.disconnect();
      });
      for (let i = 0; i < numCPUs; i++) {
        const newWorker = cluster.fork();
        console.log(`[${process.pid}] Worker ${newWorker?.pid} creado`);
      }
    }
  });

  cluster.on('online', (worker) => {
    console.log(`[${process.pid}] Worker ${worker.id} es ahora online y está aceptando conexiones`);
  });

} else {
  createAppServer(app).listen(PORT, () => {
    console.log(`[${process.pid}] Worker escuchando en el puerto ${PORT}`);
  });
}

// Información de estado del cluster en formato JSON
if (cluster.isPrimary) {
  setInterval(() => {
    const stats = {
      pid: process.pid,
      numWorkers: Object.keys(cluster.workers).length,
      workersStatus: {},
      cpusCount: os.cpus().length
    };

    for (const worker of Object.values(cluster.workers)) {
      stats.workersStatus[worker.id] = {
        state: worker.process?.state || 'unknown',
        memoryUsage: worker.memory && worker.memory.rss ? Math.round(worker.memory.rss / 1024 / 1024) + ' MB' : 'N/A'
      };
    }

    console.log(JSON.stringify(stats, null, 2));
  }, 5000);
}
