require('dotenv').config();

const app = require('../app');
const connectDatabase = require('../config/db');

let databaseReady = false;

async function ensureDatabase() {
  if (!databaseReady) {
    await connectDatabase();
    databaseReady = true;
  }
}

module.exports = async function handler(req, res) {
  await ensureDatabase();
  return app(req, res);
};