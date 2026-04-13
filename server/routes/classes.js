const express = require('express');
const mongoose = require('mongoose');
const { query, param } = require('express-validator');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/error');
const router = express.Router();

const STYLES = ['kpop', 'chinese', 'hiphop', 'contemporary', 'other'];

// GET /api/classes
router.get(
  '/',
  [query('style').optional().isIn(STYLES)],
  validate,
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    if (req.query.style) filter.style = req.query.style;
    const classes = await Class.find(filter).populate('teacher');
    res.json(classes);
  })
);

// GET /api/classes/teachers/all
router.get(
  '/teachers/all',
  asyncHandler(async (req, res) => {
    const teachers = await Teacher.find().populate('classes');
    res.json(teachers);
  })
);

// GET /api/classes/:id
router.get(
  '/:id',
  [param('id').custom((v) => mongoose.isValidObjectId(v))],
  validate,
  asyncHandler(async (req, res) => {
    const danceClass = await Class.findById(req.params.id).populate('teacher');
    if (!danceClass) return res.status(404).json({ error: 'Class not found' });
    res.json(danceClass);
  })
);

module.exports = router;
