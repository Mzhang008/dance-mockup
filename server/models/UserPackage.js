const mongoose = require('mongoose');

const userPackageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  type: { type: String, enum: ['punchcard', 'membership'], required: true },
  // Punchcards
  creditsRemaining: { type: Number, default: 0 },
  // Memberships
  expiresAt: { type: Date },
  // Both
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'depleted'],
    default: 'active',
    index: true,
  },
  squarePaymentId: { type: String },
  purchasedAt: { type: Date, default: Date.now },
});

userPackageSchema.methods.isUsable = function () {
  if (this.status !== 'active') return false;
  if (this.type === 'membership') return this.expiresAt && this.expiresAt > new Date();
  if (this.type === 'punchcard') return this.creditsRemaining > 0;
  return false;
};

module.exports = mongoose.model('UserPackage', userPackageSchema);
