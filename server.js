require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./config/db');

const port = process.env.PORT || 3000;

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Expense Tracker running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start the server:', error.message);
  process.exit(1);
});
