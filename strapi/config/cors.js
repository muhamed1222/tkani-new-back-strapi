module.exports = {
  enabled: true,
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:1337', 'http://127.0.0.1:1337'],
  headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
};