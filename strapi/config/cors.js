module.exports = {
  enabled: true,
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
};