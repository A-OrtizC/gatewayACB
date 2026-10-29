const routes = [
  { id: "r-1", origen: "A", destino: "B", distanciaKm: 10 },
  { id: "r-2", origen: "B", destino: "C", distanciaKm: 15 },
];

module.exports = {
  findAll: (query = {}) => Promise.resolve({ items: routes, total: routes.length, query }),
  findById: (id) => Promise.resolve(routes.find((r) => r.id === id) || null),
  create: (data) => Promise.resolve({ id: "r-new", ...data }),
  update: (id, data) => Promise.resolve({ id, ...data }),
  partialUpdate: (id, data) => Promise.resolve({ id, ...data }),
  remove: (id) => Promise.resolve({ deleted: true, id }),
};
