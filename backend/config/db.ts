import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

// Load backend/.env when commands are run from the backend package directory.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
