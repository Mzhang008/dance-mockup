const express = require('express');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const router = express.Router();

// GET /api/classes
router.get('/', async (req, res) => {
  try {
    const { style } = req.query;
    const filter = { active: true };
    if (style) filter.style = style;
    const classes = await Class.find(filter).populate('teacher');
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/classes/:id
router.get('/:id', async (req, res) => {
  try {
    const danceClass = await Class.findById(req.params.id).populate('teacher');
    if (!danceClass) return res.status(404).json({ error: 'Class not found' });
    res.json(danceClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teachers
router.get('/teachers/all', async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('classes');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
