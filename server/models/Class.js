const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  title: { type: String, required: true },
  style: { type: String, enum: ['kpop', 'chinese', 'hiphop', 'contemporary', 'other'], required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  description: { type: String },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  enrolled: { type: Number, default: 0 },
  schedule: {
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: { type: String },
    endTime: { type: String }
  },
  googleCalendarEventId: { type: String },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Class', classSchema);
