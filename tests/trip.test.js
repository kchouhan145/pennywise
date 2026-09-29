const test = require('node:test');
const assert = require('node:assert/strict');

const Trip = require('../models/Trip');

test('trip model exposes required fields and enum validation', () => {
  assert.ok(Trip);
  assert.ok(Trip.schema.path('user'));
  assert.ok(Trip.schema.path('name'));
  assert.ok(Trip.schema.path('destination'));
  assert.ok(Trip.schema.path('budget'));

  const currencyValues = Trip.schema.path('currency').enumValues;
  assert.ok(currencyValues.includes('INR'));
  assert.ok(currencyValues.includes('USD'));
});

test('trip schema enforces indexed uniqueness by user and name', () => {
  const index = Trip.schema.indexes().find(([spec]) => spec.user === 1 && spec.name === 1);
  assert.ok(index);
});
