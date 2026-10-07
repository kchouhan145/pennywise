const session = require('express-session');
const MongoStore = require('connect-mongo');

function createSessionMiddleware() {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret || sessionSecret === 'replace-with-a-long-random-string') {
    throw new Error('Set a unique SESSION_SECRET in your .env file.');
  }

  return session({
    name: 'pennywise.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      // Detect HTTPS from the forwarded protocol so preview and custom deployments
      // do not lose the session cookie when NODE_ENV is set to production.
      secure: 'auto',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });
}

module.exports = createSessionMiddleware;
