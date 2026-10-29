const operations = [
  { id: "op-1", tipo: "compra", estado: "completada", monto: 100.5 },
  { id: "op-2", tipo: "venta", estado: "pendiente", monto: 250.0 },
];

module.exports = {
  findAll: (query = {}) => Promise.resolve({ items: operations, total: operations.length, query }),
  findById: (id) => Promise.resolve(operations.find((o) => o.id === id) || null),
  create: (data) => Promise.resolve({ id: "op-new", ...data }),
  update: (id, data) => Promise.resolve({ id, ...data }),
  partialUpdate: (id, data) => Promise.resolve({ id, ...data }),
  remove: (id) => Promise.resolve({ deleted: true, id }),
};
