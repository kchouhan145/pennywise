const express = require('express');
const { body, validationResult } = require('express-validator');

const Trip = require('../models/Trip');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const tripRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Trip name must be 2-80 characters.'),
  body('destination').trim().isLength({ min: 2, max: 120 }).withMessage('Destination must be 2-120 characters.'),
  body('startDate').isISO8601().withMessage('Enter a valid start date.'),
  body('endDate').isISO8601().withMessage('Enter a valid end date.'),
  body('budget').isFloat({ min: 0 }).withMessage('Budget must be zero or more.'),
  body('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP']).withMessage('Choose a valid currency.'),
];

const expenseRules = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Enter a valid amount greater than zero.'),
  body('category').isMongoId().withMessage('Choose a valid category.'),
  body('date').optional().isISO8601().withMessage('Enter a valid date.'),
  body('paymentMethod').optional().isIn(['Cash', 'UPI', 'Card', 'Other']).withMessage('Choose a payment method.'),
  body('note').optional().trim().isLength({ max: 240 }).withMessage('Notes are limited to 240 characters.'),
  body('paidBy').optional().trim().isLength({ max: 80 }).withMessage('Paid-by values are limited to 80 characters.'),
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

function normalizeSplitAmong(rawSplitAmong) {
  if (Array.isArray(rawSplitAmong)) {
    return rawSplitAmong.map((person) => String(person).trim()).filter(Boolean);
  }

  if (typeof rawSplitAmong === 'string') {
    return rawSplitAmong
      .split(',')
      .map((person) => person.trim())
      .filter(Boolean);
  }

  return [];
}

function escapeCsv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function getTripStatus(trip) {
  const today = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  if (today < start) return 'Upcoming';
  if (today >= start && today <= end) return 'Ongoing';
  return 'Completed';
}

router.use(requireAuth);

router.get('/:id/export', async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.session.userId }).lean();
    if (!trip) {
      return res.redirect('/trips');
    }

    const expenses = await Expense.find({ user: req.session.userId, trip: trip._id })
      .sort({ date: -1, createdAt: -1 })
      .populate('category', 'name')
      .lean();

    const rows = [
      ['Date', 'Category', 'Amount', 'Payment Method', 'Note', 'Tags', 'Paid By', 'Split Among'].map(escapeCsv).join(','),
      ...expenses.map((expense) => [
        new Date(expense.date).toISOString().slice(0, 10),
        expense.category?.name || 'Uncategorized',
        Number(expense.amount).toFixed(2),
        expense.paymentMethod,
        expense.note || '',
        (expense.tags || []).join(' | '),
        expense.paidBy || '',
        (expense.splitAmong || []).join(' | '),
      ].map(escapeCsv).join(',')),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="trip-${trip.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv"`);
    res.send(rows.join('\n'));
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const trips = await Trip.find({ user: req.session.userId }).sort({ startDate: 1 }).lean();

    res.render('trips/index', {
      pageTitle: 'Trips',
      currentPath: '/trips',
      trips: trips.map((trip) => ({
        ...trip,
        status: getTripStatus(trip),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/new', async (req, res, next) => {
  try {
    res.render('trips/new', {
      pageTitle: 'New trip',
      currentPath: '/trips',
      errors: [],
      formData: {
        name: '',
        destination: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        budget: '',
        currency: 'INR',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', tripRules, async (req, res, next) => {
  const errors = validationResult(req).array();

  if (errors.length) {
    return res.render('trips/new', {
      pageTitle: 'New trip',
      currentPath: '/trips',
      errors,
      formData: {
        name: req.body.name || '',
        destination: req.body.destination || '',
        startDate: req.body.startDate || new Date().toISOString().slice(0, 10),
        endDate: req.body.endDate || new Date().toISOString().slice(0, 10),
        budget: req.body.budget || '',
        currency: req.body.currency || 'INR',
      },
    });
  }

  try {
    const trip = await Trip.create({
      user: req.session.userId,
      name: req.body.name,
      destination: req.body.destination,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      budget: Number(req.body.budget),
      currency: req.body.currency || 'INR',
      members: [req.body.member || ''].filter(Boolean),
    });

    return res.redirect(`/trips/${trip._id}`);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    if (trip) {
      await Expense.deleteMany({ user: req.session.userId, trip: trip._id });
    }
    return res.redirect('/trips');
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.session.userId }).lean();
    if (!trip) {
      return res.redirect('/trips');
    }

    const categories = await Category.find({ user: req.session.userId }).sort({ name: 1 }).lean();
    const [spentSummary, categoryBreakdown, tripExpenses] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.session.userId, trip: trip._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { user: req.session.userId, trip: trip._id } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        {
          $project: {
            _id: 0,
            name: '$category.name',
            color: '$category.color',
            icon: '$category.icon',
            total: 1,
          },
        },
      ]),
      Expense.find({ user: req.session.userId, trip: trip._id })
        .sort({ date: -1, createdAt: -1 })
        .populate('category', 'name color icon')
        .lean(),
    ]);

    const spent = spentSummary[0]?.total || 0;
    const remaining = Number(trip.budget) - spent;
    const percentUsed = Number(trip.budget) > 0 ? Math.min((spent / Number(trip.budget)) * 100, 100) : 0;

    res.render('trips/detail', {
      pageTitle: `${trip.name}`,
      currentPath: '/trips',
      trip: {
        ...trip,
        status: getTripStatus(trip),
        budget: Number(trip.budget),
      },
      categories,
      summary: {
        spent,
        remaining,
        percentUsed,
      },
      categoryBreakdown,
      expenses: tripExpenses.map((expense) => ({
        ...expense,
        formattedAmount: new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(expense.amount),
        dateLabel: new Intl.DateTimeFormat('en-IN', {
          day: 'numeric',
          month: 'short',
        }).format(new Date(expense.date)),
      })),
      errors: [],
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/expenses', expenseRules, async (req, res, next) => {
  const errors = validationResult(req).array();

  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.session.userId });
    if (!trip) {
      return res.redirect('/trips');
    }

    if (errors.length) {
      return res.redirect(`/trips/${trip._id}`);
    }

    const category = await Category.findOne({ _id: req.body.category, user: req.session.userId });
    if (!category) {
      return res.redirect(`/trips/${trip._id}`);
    }

    await Expense.create({
      user: req.session.userId,
      amount: Number(req.body.amount),
      category: category._id,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      note: req.body.note || '',
      paymentMethod: req.body.paymentMethod || 'Card',
      trip: trip._id,
      tags: normalizeTags(req.body.tags),
      paidBy: req.body.paidBy || null,
      splitAmong: normalizeSplitAmong(req.body.splitAmong),
    });

    return res.redirect(`/trips/${trip._id}`);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
