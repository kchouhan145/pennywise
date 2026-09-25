const express = require('express');
const { body, validationResult } = require('express-validator');

const Category = require('../models/Category');
const Expense = require('../models/Expense');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const categoryRules = [
  body('name').trim().isLength({ min: 2, max: 40 }).withMessage('Category names must be 2-40 characters.'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Choose a valid color.'),
  body('icon').optional().trim().isLength({ min: 1, max: 4 }).withMessage('Icons must be short labels.'),
];

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.session.userId }).sort({ name: 1 }).lean();

    res.render('categories/index', {
      pageTitle: 'Categories',
      currentPath: '/categories',
      categories,
      errors: [],
      formData: { name: '', color: '#2d7958', icon: '•' },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', categoryRules, async (req, res, next) => {
  const errors = validationResult(req).array();
  if (errors.length) {
    const categories = await Category.find({ user: req.session.userId }).sort({ name: 1 }).lean();
    return res.render('categories/index', {
      pageTitle: 'Categories',
      currentPath: '/categories',
      categories,
      errors,
      formData: {
        name: req.body.name || '',
        color: req.body.color || '#2d7958',
        icon: req.body.icon || '•',
      },
    });
  }

  try {
    const category = new Category({
      user: req.session.userId,
      name: req.body.name,
      color: req.body.color || '#2d7958',
      icon: req.body.icon || '•',
    });

    await category.save();
    res.redirect('/categories');
  } catch (error) {
    if (error.code === 11000) {
      const categories = await Category.find({ user: req.session.userId }).sort({ name: 1 }).lean();
      return res.render('categories/index', {
        pageTitle: 'Categories',
        currentPath: '/categories',
        categories,
        errors: [{ msg: 'A category with that name already exists.' }],
        formData: {
          name: req.body.name || '',
          color: req.body.color || '#2d7958',
          icon: req.body.icon || '•',
        },
      });
    }

    return next(error);
  }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.session.userId });
    if (!category) {
      return res.redirect('/categories');
    }

    if (category.isDefault) {
      return res.redirect('/categories');
    }

    const fallback = await Category.findOne({ user: req.session.userId, name: 'Other' });

    if (fallback) {
      await Expense.updateMany({ user: req.session.userId, category: category._id }, { $set: { category: fallback._id } });
    }

    await category.deleteOne();
    return res.redirect('/categories');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
