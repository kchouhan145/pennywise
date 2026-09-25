const express = require('express');
const { body, validationResult } = require('express-validator');

const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const expenseRules = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Enter a valid amount greater than zero.'),
  body('category').isMongoId().withMessage('Choose a valid category.'),
  body('date').optional().isISO8601().withMessage('Enter a valid date.'),
  body('paymentMethod').optional().isIn(['Cash', 'UPI', 'Card', 'Other']).withMessage('Choose a payment method.'),
  body('note').optional().trim().isLength({ max: 240 }).withMessage('Notes are limited to 240 characters.'),
];

router.use(requireAuth);

router.get('/new', async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.session.userId }).sort({ name: 1 }).lean();
    res.render('expenses/new', {
      pageTitle: 'Add expense',
      currentPath: '/expenses/new',
      categories,
      expense: null,
      errors: [],
      formData: {
        amount: '',
        category: categories[0]?._id || '',
        date: new Date().toISOString().slice(0, 10),
        note: '',
        paymentMethod: 'Card',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', expenseRules, async (req, res, next) => {
  const errors = validationResult(req).array();

  try {
    const categories = await Category.find({ user: req.session.userId }).sort({ name: 1 }).lean();
    if (errors.length) {
      return res.render('expenses/new', {
        pageTitle: 'Add expense',
        currentPath: '/expenses/new',
        categories,
        expense: null,
        errors,
        formData: {
          amount: req.body.amount || '',
          category: req.body.category || '',
          date: req.body.date || new Date().toISOString().slice(0, 10),
          note: req.body.note || '',
          paymentMethod: req.body.paymentMethod || 'Card',
        },
      });
    }

    const category = await Category.findOne({ _id: req.body.category, user: req.session.userId });
    if (!category) {
      return res.redirect('/');
    }

    await Expense.create({
      user: req.session.userId,
      amount: Number(req.body.amount),
      category: category._id,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      note: req.body.note || '',
      paymentMethod: req.body.paymentMethod || 'Card',
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    });

    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/edit', async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.session.userId }).sort({ name: 1 }).lean();
    const expense = await Expense.findOne({ _id: req.params.id, user: req.session.userId }).lean();

    if (!expense) {
      return res.redirect('/');
    }

    return res.render('expenses/edit', {
      pageTitle: 'Edit expense',
      currentPath: '/expenses/edit',
      categories,
      expense,
      errors: [],
      formData: {
        amount: expense.amount,
        category: expense.category,
        date: new Date(expense.date).toISOString().slice(0, 10),
        note: expense.note,
        paymentMethod: expense.paymentMethod,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/update', expenseRules, async (req, res, next) => {
  const errors = validationResult(req).array();

  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.session.userId });
    if (!expense) {
      return res.redirect('/');
    }

    const categories = await Category.find({ user: req.session.userId }).sort({ name: 1 }).lean();
    if (errors.length) {
      return res.render('expenses/edit', {
        pageTitle: 'Edit expense',
        currentPath: '/expenses/edit',
        categories,
        expense,
        errors,
        formData: {
          amount: req.body.amount || expense.amount,
          category: req.body.category || expense.category,
          date: req.body.date || new Date(expense.date).toISOString().slice(0, 10),
          note: req.body.note || expense.note,
          paymentMethod: req.body.paymentMethod || expense.paymentMethod,
        },
      });
    }

    expense.amount = Number(req.body.amount);
    expense.category = req.body.category;
    expense.date = req.body.date ? new Date(req.body.date) : expense.date;
    expense.note = req.body.note || '';
    expense.paymentMethod = req.body.paymentMethod || 'Card';

    await expense.save();
    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.session.userId });
    if (expense) {
      await expense.deleteOne();
    }
    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
