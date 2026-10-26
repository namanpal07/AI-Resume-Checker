// Ensure browser graphics polyfills exist for headless serverless execution
require('../backend/services/polyfills');

// Vercel Serverless Function entry point
const app = require('../backend/server');

module.exports = app;
