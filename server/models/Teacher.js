const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: { type: String },
  photo: { type: String },
  specialties: [{ type: String }],
  instagram: { type: String },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }]
});

module.exports = mongoose.model('Teacher', teacherSchema);
