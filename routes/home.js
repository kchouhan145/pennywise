const express = require('express');

const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    const [monthlySummary, todaySummary, recentExpenses, categories] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: {
              $gte: startOfMonth,
              $lt: endOfMonth,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: {
              $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
              $lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1),
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Expense.find({ user: userId })
        .sort({ date: -1, createdAt: -1 })
        .populate('category', 'name color icon')
        .limit(5)
        .lean(),
      Category.find({ user: userId }).sort({ name: 1 }).lean(),
    ]);

    const spent = monthlySummary[0]?.total || 0;
    const todaySpent = todaySummary[0]?.total || 0;
    const budget = 0;

    res.render('home/index', {
      pageTitle: 'Home',
      currentPath: '/',
      monthName: new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(currentDate),
      categories,
      summary: {
        spent,
        budget,
        remaining: budget - spent,
        today: todaySpent,
      },
      recentExpenses: recentExpenses.map((expense) => ({
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
    });
  } catch (error) {
    next(error);
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'expense-tracker' });
});

module.exports = router;
