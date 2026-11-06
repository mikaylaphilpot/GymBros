import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

// Load backend/.env regardless of the directory used to start the server.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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
