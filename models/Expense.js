const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 240,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Other'],
      default: 'Card',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (values) => values.every((tag) => tag.trim().length > 0 && tag.trim().length <= 30),
        message: 'Each tag must be 1-30 characters long.',
      },
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    paidBy: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
    },
    splitAmong: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

expenseSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
