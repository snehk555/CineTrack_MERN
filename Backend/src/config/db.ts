import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';


let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) return;

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info('MongoDB connected');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};