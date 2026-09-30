const express = require('express');
const { body, validationResult } = require('express-validator');

const RecurringExpense = require('../models/RecurringExpense');
const Category = require('../models/Category');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const recurringRules = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Enter a valid amount.'),
  body('category').isMongoId().withMessage('Choose a valid category.'),
  body('frequency').isIn(['daily', 'weekly', 'monthly']).withMessage('Choose a valid frequency.'),
  body('nextRunDate').isISO8601().withMessage('Choose a valid next run date.'),
  body('note').optional().trim().isLength({ max: 240 }).withMessage('Notes are limited to 240 characters.'),
  body('paymentMethod').optional().isIn(['Cash', 'UPI', 'Card', 'Other']).withMessage('Choose a payment method.'),
];

function normalizeTags(rawTags) {
  if (Array.isArray(rawTags)) {
    return rawTags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof rawTags === 'string') {
    return rawTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.session.userId }).sort({ name: 1 }).lean();
    const recurring = await RecurringExpense.find({ user: req.session.userId })
      .sort({ nextRunDate: 1, createdAt: -1 })
      .populate('category', 'name color icon')
      .lean();

    res.render('recurring/index', {
      pageTitle: 'Recurring expenses',
      currentPath: '/recurring',
      categories,
      recurring: recurring.map((item) => ({
        ...item,
        formattedAmount: new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(item.amount),
      })),
      errors: [],
      formData: {
        amount: '',
        category: categories[0]?._id || '',
        frequency: 'monthly',
        nextRunDate: new Date().toISOString().slice(0, 10),
        note: '',
        paymentMethod: 'Card',
        tags: '',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', recurringRules, async (req, res, next) => {
  const errors = validationResult(req).array();

  try {
    const categories = await Category.find({ user: req.session.userId }).sort({ name: 1 }).lean();
    if (errors.length) {
      const recurring = await RecurringExpense.find({ user: req.session.userId })
        .sort({ nextRunDate: 1, createdAt: -1 })
        .populate('category', 'name color icon')
        .lean();

      return res.render('recurring/index', {
        pageTitle: 'Recurring expenses',
        currentPath: '/recurring',
        categories,
        recurring: recurring.map((item) => ({
          ...item,
          formattedAmount: new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(item.amount),
        })),
        errors,
        formData: {
          amount: req.body.amount || '',
          category: req.body.category || categories[0]?._id || '',
          frequency: req.body.frequency || 'monthly',
          nextRunDate: req.body.nextRunDate || new Date().toISOString().slice(0, 10),
          note: req.body.note || '',
          paymentMethod: req.body.paymentMethod || 'Card',
          tags: req.body.tags || '',
        },
      });
    }

    const category = await Category.findOne({ _id: req.body.category, user: req.session.userId });
    if (!category) {
      return res.redirect('/recurring');
    }

    await RecurringExpense.create({
      user: req.session.userId,
      amount: Number(req.body.amount),
      category: category._id,
      frequency: req.body.frequency,
      nextRunDate: new Date(req.body.nextRunDate),
      note: req.body.note || '',
      paymentMethod: req.body.paymentMethod || 'Card',
      tags: normalizeTags(req.body.tags),
      active: true,
    });

    return res.redirect('/recurring');
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/toggle', async (req, res, next) => {
  try {
    const recurring = await RecurringExpense.findOne({ _id: req.params.id, user: req.session.userId });
    if (!recurring) {
      return res.redirect('/recurring');
    }

    recurring.active = !recurring.active;
    await recurring.save();
    return res.redirect('/recurring');
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    await RecurringExpense.deleteOne({ _id: req.params.id, user: req.session.userId });
    return res.redirect('/recurring');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
