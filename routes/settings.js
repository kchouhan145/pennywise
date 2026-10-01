const express = require('express');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const MonthlyBudget = require('../models/MonthlyBudget');
const RecurringExpense = require('../models/RecurringExpense');
const Trip = require('../models/Trip');
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

router.post('/delete-account', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    await Promise.all([
      Category.deleteMany({ user: userId }),
      Expense.deleteMany({ user: userId }),
      MonthlyBudget.deleteMany({ user: userId }),
      RecurringExpense.deleteMany({ user: userId }),
      Trip.deleteMany({ user: userId }),
      User.deleteOne({ _id: userId }),
    ]);

    return req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie('pennywise.sid');
      return res.redirect('/auth/register');
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
