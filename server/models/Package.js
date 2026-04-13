const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  type: { type: String, enum: ['punchcard', 'membership'], required: true },
  price: { type: Number, required: true, min: 0 },
  // Punchcards: number of class credits granted
  credits: { type: Number, min: 0 },
  // Memberships: duration in days for unlimited access
  durationDays: { type: Number, min: 0 },
  // Memberships: optional cap on bookings per period (0 = unlimited)
  maxBookingsPerPeriod: { type: Number, default: 0 },
  // Optional: restrict to certain class styles
  allowedStyles: [{ type: String, enum: ['kpop', 'chinese', 'hiphop', 'contemporary', 'other'] }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Package', packageSchema);
