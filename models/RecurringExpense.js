const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema(
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
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    nextRunDate: {
      type: Date,
      required: true,
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
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

recurringExpenseSchema.index({ user: 1, active: 1, nextRunDate: 1 });

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);
