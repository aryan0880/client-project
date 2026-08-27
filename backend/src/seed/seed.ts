/**
 * Seed script — populates the database with initial test data.
 * Run with: npm run seed
 *
 * Creates:
 *  - 1 Admin user (admin@company.com / Admin123!)
 *  - 3 Test suppliers
 *  - 5 Assessment questions
 *  - 1 Test survey
 *  - 3 Survey assignments (one per supplier) with unique tokens
 */
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Supplier } from '../models/Supplier';
import { Question } from '../models/Question';
import { Survey } from '../models/Survey';
import { SurveyAssignment } from '../models/SurveyAssignment';
import { generateSurveyToken } from '../utils/tokenGenerator';
import { env } from '../config/env';

async function seed(): Promise<void> {
  if (!env.mongoUri) {
    console.error('MONGODB_URI is not set. Cannot seed without a database connection.');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('[Seed] Connected to MongoDB');

  // Clear existing seed data
  await Promise.all([
    User.deleteMany({}),
    Supplier.deleteMany({}),
    Question.deleteMany({}),
    Survey.deleteMany({}),
    SurveyAssignment.deleteMany({}),
  ]);
  console.log('[Seed] Cleared existing data');

  // Admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@company.com',
    password: 'Admin123!', // Hashed automatically by pre-save hook
    role: 'admin',
  });
  console.log(`[Seed] Admin created: ${admin.email}`);

  // Suppliers
  const suppliers = await Supplier.insertMany([
    { name: 'ABC Industrial Supplies', email: 'supplier1@test.com', status: 'active' },
    { name: 'XYZ Components', email: 'supplier2@test.com', status: 'active' },
    { name: 'Global Manufacturing', email: 'supplier3@test.com', status: 'active' },
  ]);
  console.log(`[Seed] ${suppliers.length} suppliers created`);

  // Questions
  const questions = await Question.insertMany([
    {
      text: 'How would you rate the overall quality of supplied products?',
      type: 'rating',
      points: 1,
      order: 1,
    },
    {
      text: 'Are deliveries generally made on time?',
      type: 'yesno',
      points: 1,
      order: 2,
    },
    {
      text: 'How would you rate communication with the supplier?',
      type: 'rating',
      points: 1,
      order: 3,
    },
    {
      text: 'Are invoices and documentation provided accurately?',
      type: 'yesno',
      points: 1,
      order: 4,
    },
    {
      text: 'Would you recommend continuing business with this supplier?',
      type: 'yesno',
      points: 1,
      order: 5,
    },
  ]);
  console.log(`[Seed] ${questions.length} questions created`);

  // Survey
  const survey = await Survey.create({
    title: 'Supplier Performance Assessment - Test',
    description:
      'A standardised assessment to evaluate supplier performance across quality, delivery, communication, and documentation.',
    status: 'active',
    questions: questions.map((q) => q._id),
    createdBy: admin._id,
  });
  console.log(`[Seed] Survey created: "${survey.title}"`);

  // Survey assignments — one unique token per supplier
  const assignments = await SurveyAssignment.insertMany(
    suppliers.map((supplier) => ({
      survey: survey._id,
      supplier: supplier._id,
      token: generateSurveyToken(),
      status: 'pending',
    }))
  );

  console.log('\n[Seed] ✅ Seed complete!\n');
  console.log('Admin login:');
  console.log('  Email:    admin@company.com');
  console.log('  Password: Admin123!\n');
  console.log('Supplier survey links (token only — prepend your frontend URL):');
  suppliers.forEach((supplier, i) => {
    console.log(`  ${supplier.name}: /survey/${assignments[i].token}`);
  });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
