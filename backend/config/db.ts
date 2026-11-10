import mongoose from 'mongoose';
import './env.js';

export async function connectToMongoDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env or the environment.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
}

export async function disconnectFromMongoDB(): Promise<void> {
  await mongoose.disconnect();
}
