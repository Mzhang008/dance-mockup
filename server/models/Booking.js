const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  squarePaymentId: { type: String },
  // Source of payment: one-off Square charge OR an existing user package
  paymentMethod: { type: String, enum: ['square', 'package'], default: 'square' },
  userPackage: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
