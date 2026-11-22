module.exports = {
  perService: {
    auth: 5000,
    users: 5000,
    operations: 6000,
    routes: 5000,
    // Go control may spend up to 5 s including its 3 s route lookup.
    gps: 9000,
    paths: 5000,
  },
  defaults: {
    call: 3000,
    orchestrator: 7000,
  },
};
