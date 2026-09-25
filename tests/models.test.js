const test = require('node:test');
const assert = require('node:assert/strict');

const Category = require('../models/Category');
const Expense = require('../models/Expense');

test('default category seed includes core spend categories', () => {
  assert.ok(Array.isArray(Category.defaultSeed));
  assert.ok(Category.defaultSeed.length >= 7);
  assert.ok(Category.defaultSeed.some((item) => item.name === 'Food'));
  assert.ok(Category.defaultSeed.some((item) => item.name === 'Bills'));
});

test('expense payment methods include required options', () => {
  const paymentMethods = Expense.schema.path('paymentMethod').enumValues;

  assert.ok(paymentMethods.includes('Cash'));
  assert.ok(paymentMethods.includes('UPI'));
  assert.ok(paymentMethods.includes('Card'));
  assert.ok(paymentMethods.includes('Other'));
});
