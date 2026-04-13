const express = require('express');
const { query } = require('express-validator');
const { calendar } = require('../config/google');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/error');
const router = express.Router();

// GET /api/calendar/events
router.get(
  '/events',
  [
    query('timeMin').optional().isISO8601(),
    query('timeMax').optional().isISO8601(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { timeMin, timeMax } = req.query;
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = (response.data.items || []).map((event) => ({
      id: event.id,
      title: event.summary,
      description: event.description,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location,
    }));

    res.json(events);
  })
);

module.exports = router;
