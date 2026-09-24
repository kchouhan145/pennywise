const express = require('express');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const { redirectIfAuthenticated } = require('../middleware/auth');

const router = express.Router();

const registrationRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your name.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Enter your password.'),
];

function renderRegister(req, res, errors = []) {
  return res.render('auth/register', {
    pageTitle: 'Create account',
    currentPath: '/auth/register',
    errors,
    formData: { name: req.body.name || '', email: req.body.email || '' },
  });
}

function renderLogin(req, res, errors = []) {
  return res.render('auth/login', {
    pageTitle: 'Log in',
    currentPath: '/auth/login',
    errors,
    formData: { email: req.body.email || '' },
  });
}

router.get('/register', redirectIfAuthenticated, (req, res) => renderRegister(req, res));

router.post('/register', redirectIfAuthenticated, registrationRules, async (req, res, next) => {
  const errors = validationResult(req).array();
  if (errors.length) {
    return renderRegister(req, res, errors);
  }

  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return renderRegister(req, res, [{ msg: 'An account with that email already exists.' }]);
    }

    const user = new User({ name: req.body.name, email: req.body.email });
    await user.setPassword(req.body.password);
    await user.save();

    req.session.userId = user.id;
    return req.session.save(() => res.redirect('/'));
  } catch (error) {
    return next(error);
  }
});

router.get('/login', redirectIfAuthenticated, (req, res) => renderLogin(req, res));

router.post('/login', redirectIfAuthenticated, loginRules, async (req, res, next) => {
  const errors = validationResult(req).array();
  if (errors.length) {
    return renderLogin(req, res, errors);
  }

  try {
    const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
    if (!user || !(await user.checkPassword(req.body.password))) {
      return renderLogin(req, res, [{ msg: 'Email or password is incorrect.' }]);
    }

    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.userId = user.id;
      return req.session.save(() => res.redirect('/'));
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('pennywise.sid');
    return res.redirect('/auth/login');
  });
});

module.exports = router;
