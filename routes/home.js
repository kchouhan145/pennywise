const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.render('home/index', {
    pageTitle: 'Home',
    currentPath: '/',
    monthName: new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date()),
    summary: {
      spent: 0,
      budget: 0,
      remaining: 0,
      today: 0,
    },
    recentExpenses: [],
  });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'expense-tracker' });
});

module.exports = router;
