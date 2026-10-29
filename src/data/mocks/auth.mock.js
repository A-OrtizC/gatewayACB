const auth = [
  { id: "a-1", username: "test", email: "test@example.com", role: "admin" },
];

module.exports = {
  findAll: (query = {}) => Promise.resolve({ items: auth, total: auth.length, query }),
  findById: (id) => Promise.resolve(auth.find((a) => a.id === id) || null),
  create: (data) => Promise.resolve({ id: "a-new", ...data }),
  update: (id, data) => Promise.resolve({ id, ...data }),
  partialUpdate: (id, data) => Promise.resolve({ id, ...data }),
  remove: (id) => Promise.resolve({ deleted: true, id }),
};
