const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  const connectWithRetry = async (attempt = 1) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
    } catch (err) {
      const delay = Math.min(30000, 1000 * 2 ** attempt);
      logger.error({ err: err.message, attempt, delay }, 'MongoDB connect failed, retrying');
      if (attempt >= 6) throw err;
      await new Promise((r) => setTimeout(r, delay));
      return connectWithRetry(attempt + 1);
    }
  };

  await connectWithRetry();
};

module.exports = connectDB;
