const User = require('../models/User');

async function loadCurrentUser(req, res, next) {
  res.locals.currentUser = null;

  if (!req.session.userId) {
    return next();
  }

  try {
    const user = await User.findById(req.session.userId).lean();
    if (!user) {
      req.session.destroy(() => {});
      return next();
    }

    res.locals.currentUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }

  return next();
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/');
  }

  return next();
}

module.exports = { loadCurrentUser, requireAuth, redirectIfAuthenticated };
