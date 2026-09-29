const test = require('node:test');
const assert = require('node:assert/strict');

const MonthlyBudget = require('../models/MonthlyBudget');

test('monthly budget model exposes required fields and validation', () => {
  assert.ok(MonthlyBudget);
  assert.ok(MonthlyBudget.schema.path('user'));
  assert.ok(MonthlyBudget.schema.path('month'));
  assert.ok(MonthlyBudget.schema.path('amount'));

  const amountPath = MonthlyBudget.schema.path('amount');
  assert.ok(amountPath.options.min >= 0);
});

test('monthly budget schema enforces unique user and month', () => {
  const index = MonthlyBudget.schema.indexes().find(([spec]) => spec.user === 1 && spec.month === 1);
  assert.ok(index);
});
