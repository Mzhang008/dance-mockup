require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const logger = require('./config/logger');
const { errorHandler, notFoundHandler } = require('./middleware/error');
const { authLimiter, paymentLimiter, apiLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const calendarRoutes = require('./routes/calendar');
const classRoutes = require('./routes/classes');
const packageRoutes = require('./routes/packages');

const app = express();

// Trust proxy when behind a load balancer (Render, Heroku, etc.)
app.set('trust proxy', 1);

app.use(helmet());
app.use(pinoHttp({ logger }));

// Square webhook needs the raw body for signature verification — mount before json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/packages', paymentLimiter, packageRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/ready', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  if (dbState !== 1) return res.status(503).json({ ready: false, db: dbState });
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

const start = async () => {
  await connectDB();
  server = app.listen(PORT, '0.0.0.0', () => logger.info(`Server running on port ${PORT}`));
};

const shutdown = (signal) => async () => {
  logger.info({ signal }, 'graceful shutdown');
  if (server) server.close();
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
};

process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
  process.exit(1);
});

start().catch((err) => {
  logger.fatal({ err }, 'startup failed');
  process.exit(1);
});
