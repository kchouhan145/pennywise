const path = require('node:path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const csrf = require('csurf');

const createSessionMiddleware = require('./config/session');
const { loadCurrentUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const categoryRoutes = require('./routes/categories');
const expenseRoutes = require('./routes/expenses');
const reportsRoutes = require('./routes/reports');
const tripsRoutes = require('./routes/trips');
const recurringRoutes = require('./routes/recurring');
const settingsRoutes = require('./routes/settings');

const app = express();

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
    },
  },
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(createSessionMiddleware());
app.use(csrf());
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use(loadCurrentUser);

app.locals.appName = 'Pennywise';
app.locals.currencySymbol = '₹';
app.locals.currentUser = null;

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/expenses', expenseRoutes);
app.use('/reports', reportsRoutes);
app.use('/trips', tripsRoutes);
app.use('/recurring', recurringRoutes);
app.use('/settings', settingsRoutes);
app.use('/', homeRoutes);

app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Page not found' });
});

app.use((error, req, res, _next) => {
  if (error.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('500', {
      pageTitle: 'Request rejected',
      message: 'Your form session expired. Please go back and try again.',
    });
  }

  console.error(error);
  return res.status(500).render('500', { pageTitle: 'Something went wrong' });
});

module.exports = app;
