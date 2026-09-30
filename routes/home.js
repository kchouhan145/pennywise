const express = require('express');

const Expense = require('../models/Expense');
const Category = require('../models/Category');
const MonthlyBudget = require('../models/MonthlyBudget');
const Trip = require('../models/Trip');
const RecurringExpense = require('../models/RecurringExpense');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const hour = currentDate.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const [monthlySummary, todaySummary, recentExpenses, categories, monthlyBudget, trips, recurringCount, topCategory, biggestExpense, previousMonthSummary] = await Promise.all([
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
      MonthlyBudget.findOne({
        user: userId,
        month: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
      }).lean(),
      Trip.find({ user: userId }).sort({ startDate: 1 }).limit(3).lean(),
      RecurringExpense.countDocuments({ user: userId, active: true }),
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
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $project: { _id: 0, name: '$category.name', color: '$category.color', icon: '$category.icon', total: 1 } },
        { $sort: { total: -1, name: 1 } },
        { $limit: 1 },
      ]),
      Expense.findOne({ user: userId })
        .sort({ amount: -1, date: -1 })
        .populate('category', 'name color icon')
        .lean(),
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: {
              $gte: previousMonthStart,
              $lt: previousMonthEnd,
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const spent = monthlySummary[0]?.total || 0;
    const todaySpent = todaySummary[0]?.total || 0;
    const budget = Number(monthlyBudget?.amount || 0);
    const percentUsed = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const previousMonthSpent = previousMonthSummary[0]?.total || 0;
    const changeVsPreviousMonth = previousMonthSpent > 0 ? ((spent - previousMonthSpent) / previousMonthSpent) * 100 : 0;
    const budgetAlert =
      budget <= 0
        ? { tone: 'info', label: 'Set a budget to get alerts.' }
        : spent >= budget
          ? { tone: 'danger', label: 'Budget reached' }
          : spent >= budget * 0.8
            ? { tone: 'warning', label: 'Close to budget' }
            : { tone: 'info', label: 'On track' };

    res.render('home/index', {
      pageTitle: 'Home',
      currentPath: '/',
      greeting,
      monthName: new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(currentDate),
      categories,
      trips,
      recurringCount,
      insight: {
        topCategory: topCategory[0] || null,
        biggestExpense,
        comparison: changeVsPreviousMonth,
      },
      summary: {
        spent,
        budget,
        remaining: budget - spent,
        today: todaySpent,
        percentUsed,
        progressWidth: `${percentUsed}%`,
        budgetAlert,
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
