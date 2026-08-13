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
import Genre from '../models/genre.model.js';

const MONGODB_URI = process.env['MONGO_URI'] ?? '';

const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const seed = async () => {
  console.log('🌱 CineTrack Seed Script starting...\n');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

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
    { name: 'Crime',     color: '#7f1d1d' },
    { name: 'Fantasy',   color: '#d946ef' },
    { name: 'Mystery',   color: '#3b82f6' },
    { name: 'Family',    color: '#84cc16' },
    { name: 'History',   color: '#d97706' },
    { name: 'War',       color: '#9a3412' },
    { name: 'Music',     color: '#14b8a6' },
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

  // ── 2b. Default Categories ────────────────────────────────────────────────────
  const { default: Category } = await import('../models/category.model.js');
  const defaultCategories = [
    'Hollywood',
    'Bollywood',
    'Web Series',
    'Anime',
    'Tollywood',
    'Korean Drama',
    'Documentaries'
  ];

  let categoriesCreated = 0;
  for (const cName of defaultCategories) {
    const name = cName.toLowerCase();
    const exists = await Category.findOne({ name });
    if (!exists) {
      await Category.create({ name });
      categoriesCreated++;
    }
  }
  console.log(`✅ Categories: ${categoriesCreated} created, ${defaultCategories.length - categoriesCreated} already existed`);

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete!');
  console.log('   Run the app with: npm run dev\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
