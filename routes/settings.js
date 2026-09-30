const express = require('express');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const settingsRules = [
  body('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP']).withMessage('Choose a valid currency.'),
  body('theme').optional().isIn(['light', 'dark']).withMessage('Choose a valid theme.'),
  body('includeTripsInMonthly').optional().isBoolean().withMessage('Choose a valid option.'),
];

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId).lean();

    res.render('settings/index', {
      pageTitle: 'Settings',
      currentPath: '/settings',
      errors: [],
      formData: {
        currency: user?.currency || 'INR',
        theme: user?.theme || 'light',
        includeTripsInMonthly: Boolean(user?.includeTripsInMonthly),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', settingsRules, async (req, res, next) => {
  const errors = validationResult(req).array();

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/auth/login');
    }

    if (errors.length) {
      return res.render('settings/index', {
        pageTitle: 'Settings',
        currentPath: '/settings',
        errors,
        formData: {
          currency: req.body.currency || user.currency,
          theme: req.body.theme || user.theme,
          includeTripsInMonthly: req.body.includeTripsInMonthly === 'on',
        },
      });
    }

    user.currency = req.body.currency || user.currency;
    user.theme = req.body.theme || user.theme;
    user.includeTripsInMonthly = req.body.includeTripsInMonthly === 'on';
    await user.save();

    return res.redirect('/settings');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
