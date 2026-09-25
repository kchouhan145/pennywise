const mongoose = require('mongoose');

const defaultSeed = [
  { name: 'Food', color: '#2d7958', icon: '🍽️', isDefault: true },
  { name: 'Travel', color: '#4b7bec', icon: '✈️', isDefault: true },
  { name: 'Shopping', color: '#8b5cf6', icon: '🛍️', isDefault: true },
  { name: 'Bills', color: '#ef4444', icon: '📄', isDefault: true },
  { name: 'Entertainment', color: '#f59e0b', icon: '🎉', isDefault: true },
  { name: 'Health', color: '#10b981', icon: '💊', isDefault: true },
  { name: 'Other', color: '#64748b', icon: '•', isDefault: true },
];

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    color: {
      type: String,
      default: '#2d7958',
    },
    icon: {
      type: String,
      default: '•',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

categorySchema.index({ user: 1, name: 1 }, { unique: true });

categorySchema.statics.defaultSeed = defaultSeed;

categorySchema.statics.ensureDefaultCategories = async function ensureDefaultCategories(userId) {
  const existingCount = await this.countDocuments({ user: userId });
  if (existingCount > 0) {
    return this.find({ user: userId }).sort({ name: 1 });
  }

  const entries = defaultSeed.map((category) => ({
    ...category,
    user: userId,
  }));

  return this.insertMany(entries);
};

module.exports = mongoose.model('Category', categorySchema);
