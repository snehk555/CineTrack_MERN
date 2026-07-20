/**
 * CineTrack Seed Script
 * Run once on fresh deployment to bootstrap the database.
 *
 * Usage:  npx tsx src/scripts/seed.ts
 *
 * Reads from .env:
 *   SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_NAME
 *   MONGODB_URI
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Genre from '../models/genre.model.js';
import AppSettings from '../models/appSettings.model.js';
import SubscriptionPlan from '../models/subscriptionPlan.model.js';
import FeatureFlag from '../models/featureFlag.model.js';

const MONGODB_URI      = process.env['MONGODB_URI']          ?? '';
const SUPERADMIN_EMAIL = process.env['SUPERADMIN_EMAIL']     ?? 'admin@cinetrack.com';
const SUPERADMIN_PASS  = process.env['SUPERADMIN_PASSWORD']  ?? 'Admin@123456';
const SUPERADMIN_NAME  = process.env['SUPERADMIN_NAME']      ?? 'Super Admin';

const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const seed = async () => {
  console.log('🌱 CineTrack Seed Script starting...\n');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // ── 1. Super Admin ──────────────────────────────────────────────────────────
  const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
  if (existingSuperAdmin) {
    console.log(`⏭️  Super Admin already exists: ${existingSuperAdmin.email} — skipping`);
  } else {
    const hashed = await bcrypt.hash(SUPERADMIN_PASS, 12);
    await User.create({
      name:             SUPERADMIN_NAME,
      email:            SUPERADMIN_EMAIL,
      username:         'superadmin',
      password:         hashed,
      role:             'super_admin',
      subscriptionPlan: 'pro',
      isActive:         true,
    });
    console.log(`✅ Super Admin created: ${SUPERADMIN_EMAIL}`);
  }

  // ── 2. Default Genres ───────────────────────────────────────────────────────
  const defaultGenres = [
    { name: 'Action',    color: '#ef4444' },
    { name: 'Drama',     color: '#8b5cf6' },
    { name: 'Comedy',    color: '#f59e0b' },
    { name: 'Thriller',  color: '#1e293b' },
    { name: 'Sci-Fi',    color: '#06b6d4' },
    { name: 'Horror',    color: '#dc2626' },
    { name: 'Romance',   color: '#ec4899' },
    { name: 'Animation', color: '#10b981' },
    { name: 'Documentary', color: '#64748b' },
  ];

  let genresCreated = 0;
  for (const g of defaultGenres) {
    const slug = toSlug(g.name);
    const exists = await Genre.findOne({ slug });
    if (!exists) {
      await Genre.create({ ...g, slug });
      genresCreated++;
    }
  }
  console.log(`✅ Genres: ${genresCreated} created, ${defaultGenres.length - genresCreated} already existed`);

  // ── 3. Subscription Plans ───────────────────────────────────────────────────
  const defaultPlans = [
    {
      key: 'free',
      name: 'Free',
      priceMonthly: 0,
      priceYearly: 0,
      features: ['Access to 500+ movies', 'Watchlist (up to 20)', 'Basic search', 'Submit reviews'],
    },
    {
      key: 'premium',
      name: 'Premium',
      priceMonthly: 19900,  // ₹199/month in paise
      priceYearly: 199900,  // ₹1999/year
      features: ['All Free features', 'Unlimited watchlist', 'HD streaming', 'Priority support', 'Early access to new releases'],
    },
    {
      key: 'pro',
      name: 'Pro',
      priceMonthly: 49900,  // ₹499/month
      priceYearly: 499900,  // ₹4999/year
      features: ['All Premium features', 'Offline downloads', '4K streaming', 'Family sharing (up to 5)', 'Dedicated support'],
    },
  ];

  let plansCreated = 0;
  for (const plan of defaultPlans) {
    const exists = await SubscriptionPlan.findOne({ key: plan.key as 'free' | 'premium' | 'pro' });
    if (!exists) {
      await SubscriptionPlan.create({ ...plan, key: plan.key as 'free' | 'premium' | 'pro' });
      plansCreated++;
    }
  }
  console.log(`✅ Plans: ${plansCreated} created, ${defaultPlans.length - plansCreated} already existed`);

  // ── 4. App Settings (singleton) ─────────────────────────────────────────────
  const existingSettings = await AppSettings.findOne();
  if (!existingSettings) {
    await AppSettings.create({
      maintenanceMode:        false,
      allowNewRegistrations:  true,
      defaultSubscriptionPlan:'free',
      maxMoviesPerPage:        20,
      platformName:           'CineTrack',
      supportEmail:            'support@cinetrack.com',
    });
    console.log('✅ App Settings: default document created');
  } else {
    console.log('⏭️  App Settings already exist — skipping');
  }

  // ── 5. Default Feature Flags ─────────────────────────────────────────────────
  const defaultFlags = [
    { key: 'new_review_system',  name: 'New Review System',   description: 'Enable the new multi-criteria review UI' },
    { key: 'dark_mode_beta',     name: 'Dark Mode Beta',       description: 'Enable dark mode for beta users' },
    { key: 'ai_recommendations', name: 'AI Recommendations',   description: 'Show AI-powered movie recommendations on home page' },
    { key: 'social_features',    name: 'Social Features',      description: 'Enable follow, activity feed, and social sharing' },
  ];

  let flagsCreated = 0;
  for (const flag of defaultFlags) {
    const exists = await FeatureFlag.findOne({ key: flag.key });
    if (!exists) {
      await FeatureFlag.create({ ...flag, enabled: false });
      flagsCreated++;
    }
  }
  console.log(`✅ Feature Flags: ${flagsCreated} created, ${defaultFlags.length - flagsCreated} already existed`);

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete!');
  console.log(`   Super Admin: ${SUPERADMIN_EMAIL}`);
  console.log('   Run the app with: npm run dev\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
