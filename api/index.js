/**
 * Vercel Serverless Function Entry Point (api/index.js)
 * Exposes the Express app for Vercel deployment with dual-write telemetry and API routes.
 */

const app = require('../server');

module.exports = (req, res) => {
  return app(req, res);
};
