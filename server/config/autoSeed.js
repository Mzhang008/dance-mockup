const Class = require('../models/Class');
const Package = require('../models/Package');
const logger = require('../config/logger');

const DEFAULT_CLASSES = [
  {
    title: 'Drop-In Class',
    style: 'kpop',
    description: 'Single drop-in class. Kpop, Chinese, or Contemporary — pick any session.',
    price: 15,
    capacity: 30,
  },
];

const DEFAULT_PACKAGES = [
  {
    name: '5-Class Pack',
    description: 'Five class credits. Use anytime, any style. Never expires.',
    type: 'punchcard',
    price: 45,
    credits: 5,
    allowedStyles: [],
    active: true,
  },
];

async function autoSeed() {
  try {
    const classCount = await Class.countDocuments();
    if (classCount === 0) {
      await Class.insertMany(DEFAULT_CLASSES);
      logger.info('Auto-seeded default classes');
    }

    const pkgCount = await Package.countDocuments();
    if (pkgCount === 0) {
      await Package.insertMany(DEFAULT_PACKAGES);
      logger.info('Auto-seeded default packages');
    }
  } catch (err) {
    logger.error({ err }, 'Auto-seed failed (non-fatal)');
  }
}

module.exports = autoSeed;
