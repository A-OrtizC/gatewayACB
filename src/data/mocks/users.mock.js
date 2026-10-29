const users = [
  { id: "u-1", nombre: "Juan", apellido: "Perez", correo: "juan@example.com" },
  { id: "u-2", nombre: "Maria", apellido: "Lopez", correo: "maria@example.com" },
];

module.exports = {
  findAll: (query = {}) => Promise.resolve({ items: users, total: users.length, query }),
  findById: (id) => Promise.resolve(users.find((u) => u.id === id) || null),
  create: (data) => Promise.resolve({ id: "u-new", ...data }),
  update: (id, data) => Promise.resolve({ id, ...data }),
  partialUpdate: (id, data) => Promise.resolve({ id, ...data }),
  remove: (id) => Promise.resolve({ deleted: true, id }),
};
