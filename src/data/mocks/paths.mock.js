const paths = [
  { id: "p-1", rutaId: "r-1", orden: 1, punto: "A" },
  { id: "p-2", rutaId: "r-1", orden: 2, punto: "B" },
];

module.exports = {
  findAll: (query = {}) => Promise.resolve({ items: paths, total: paths.length, query }),
  findById: (id) => Promise.resolve(paths.find((p) => p.id === id) || null),
  create: (data) => Promise.resolve({ id: "p-new", ...data }),
  update: (id, data) => Promise.resolve({ id, ...data }),
  partialUpdate: (id, data) => Promise.resolve({ id, ...data }),
  remove: (id) => Promise.resolve({ deleted: true, id }),
};
