import cors from 'cors';
import express from 'express';
import authRouter from './routes/authRoutes';
import userRouter from './routes/userRoutes';
import { connectToMongoDB } from './config/db';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (_req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);

async function startServer(): Promise<void> {
  try {
    await connectToMongoDB();

    app.listen(5001, () => {
      console.log('Server running on port 5001');
    });
  } catch (error: unknown) {
    console.error('Server error:', error);
    process.exit(1);
  }
}

void startServer();
