const gps = [
  { id: "g-1", vehiculoId: "v-1", lat: 4.60971, lng: -74.08175, fecha: new Date().toISOString() },
  { id: "g-2", vehiculoId: "v-2", lat: 6.2442, lng: -75.5812, fecha: new Date().toISOString() },
];

module.exports = {
  findAll: (query = {}) => Promise.resolve({ items: gps, total: gps.length, query }),
  findById: (id) => Promise.resolve(gps.find((g) => g.id === id) || null),
  create: (data) => Promise.resolve({ id: "g-new", ...data }),
  update: (id, data) => Promise.resolve({ id, ...data }),
  partialUpdate: (id, data) => Promise.resolve({ id, ...data }),
  remove: (id) => Promise.resolve({ deleted: true, id }),
};
