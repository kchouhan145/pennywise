const express = require('express');
const { body, validationResult } = require('express-validator');

const Expense = require('../models/Expense');
const Category = require('../models/Category');
const MonthlyBudget = require('../models/MonthlyBudget');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const budgetRules = [
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('Select a valid month.'),
  body('amount').isFloat({ min: 0, max: 10000000 }).withMessage('Budget must be a valid number.'),
];

function getMonthParts(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return { year, monthNumber };
}

function formatMonthFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthOptions() {
  const options = [];
  const today = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    options.push({
      value: formatMonthFromDate(monthDate),
      label: new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(monthDate),
    });
  }
  return options;
}

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const selectedMonth = req.query.month || formatMonthFromDate(new Date());
    const { year, monthNumber } = getMonthParts(selectedMonth);
    const startOfMonth = new Date(year, monthNumber - 1, 1);
    const endOfMonth = new Date(year, monthNumber, 1);

    const userId = req.session.userId;
    const filters = {
      category: req.query.category || '',
      paymentMethod: req.query.paymentMethod || 'All',
      search: req.query.search || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || '',
    };

    const query = { user: userId, date: { $gte: startOfMonth, $lt: endOfMonth } };
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'All') {
      query.paymentMethod = filters.paymentMethod;
    }
    if (filters.startDate) {
      query.date.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.date.$lt = new Date(new Date(filters.endDate).getTime() + 24 * 60 * 60 * 1000);
    }
    if (filters.search) {
      query.note = { $regex: filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const [budgetRecord, totalSummary, categoryBreakdown, dailyTotals, categories, expenseList] = await Promise.all([
      MonthlyBudget.findOne({ user: userId, month: selectedMonth }).lean(),
      Expense.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: query },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        {
          $project: {
            _id: 0,
            categoryId: '$_id',
            name: '$category.name',
            color: '$category.color',
            icon: '$category.icon',
            total: 1,
          },
        },
        { $sort: { total: -1, name: 1 } },
      ]),
      Expense.aggregate([
        { $match: query },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Category.find({ user: userId }).sort({ name: 1 }).lean(),
      Expense.find(query)
        .sort({ date: -1, createdAt: -1 })
        .populate('category', 'name color icon')
        .lean(),
    ]);

    const budgetAmount = Number(budgetRecord?.amount || 0);
    const spent = totalSummary[0]?.total || 0;
    const remaining = budgetAmount - spent;
    const percentUsed = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;
    const dayInMonth = new Date(year, monthNumber, 0).getDate();
    const remainingDays = Math.max(new Date(year, monthNumber, 0).getDate() - new Date().getDate(), 0);
    const safeDailySpend = budgetAmount > 0 ? Math.max(remaining / Math.max(remainingDays, 1), 0) : 0;

    const reportDays = Array.from({ length: dayInMonth }, (_, index) => {
      const day = index + 1;
      const dayKey = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      const total = dailyTotals.find((entry) => entry._id === dayKey)?.total || 0;
      return {
        day,
        total,
      };
    });

    const expenseRows = expenseList.map((expense) => ({
      ...expense,
      formattedAmount: new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(expense.amount),
      dateLabel: new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(expense.date)),
    }));

    res.render('reports/index', {
      pageTitle: 'Monthly report',
      currentPath: '/reports',
      month: selectedMonth,
      monthName: new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(startOfMonth),
      budgetAmount,
      monthOptions: buildMonthOptions(),
      categories,
      filters,
      summary: {
        spent,
        budget: budgetAmount,
        remaining,
        percentUsed,
        safeDailySpend,
      },
      categoryBreakdown,
      dailyTotals: reportDays,
      expenses: expenseRows,
      errors: [],
    });
  } catch (error) {
    next(error);
  }
});

router.post('/budget', budgetRules, async (req, res, next) => {
  const errors = validationResult(req).array();
  const month = req.body.month || formatMonthFromDate(new Date());

  if (errors.length) {
    return res.redirect(`/reports?month=${encodeURIComponent(month)}`);
  }

  try {
    const amount = Number(req.body.amount);
    await MonthlyBudget.findOneAndUpdate(
      { user: req.session.userId, month },
      { user: req.session.userId, month, amount },
      { upsert: true, new: true, runValidators: true },
    );

    return res.redirect(`/reports?month=${encodeURIComponent(month)}`);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
