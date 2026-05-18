require('dotenv').config();
const mongoose = require('mongoose');
const Class = require('../models/Class');
const Package = require('../models/Package');
const connectDB = require('../config/db');

const CLASSES = [
  {
    title: 'Drop-In Class',
    style: 'kpop',
    description: 'Single drop-in class. Kpop, Chinese, or Contemporary — pick any session.',
    price: 15,
    capacity: 30,
  },
];

const PACKAGES = [
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

async function seed() {
  await connectDB();

  for (const c of CLASSES) {
    const exists = await Class.findOne({ title: c.title });
    if (!exists) {
      await Class.create(c);
      console.log(`Created class: ${c.title} ($${c.price})`);
    } else {
      console.log(`Class already exists: ${c.title}`);
    }
  }

  for (const p of PACKAGES) {
    const exists = await Package.findOne({ name: p.name });
    if (!exists) {
      await Package.create(p);
      console.log(`Created package: ${p.name} ($${p.price})`);
    } else {
      console.log(`Package already exists: ${p.name}`);
    }
  }

  await mongoose.connection.close();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
