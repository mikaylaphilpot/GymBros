import express from 'express';
import cors from 'cors';
import router from './routes/authRoutes';
import { connectToMongoDB } from './config/db';

// Initialize Express application
const app = express();

// Enable CORS for frontend-backend communication
// Parse incoming JSON request bodies
app.use(cors());
app.use(express.json());

// GET /api/test
// Test endpoint to verify that the backend server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Register authentication routes (signup, login, and protected user profile)
// All auth endpoints are prefixed with /api/auth
app.use('/api/auth', router);

// Connect to MongoDB before starting the Express server
async function startServer(): Promise<void> {
  try {
    // Establish database connection using config/db.js
    await connectToMongoDB();

    // Start listening for incoming requests on port 5001
    app.listen(5001, () => {
      console.log('Server running on port 5001');
    });

  } catch (error: unknown) {
    // Log startup errors and exit if the database connection fails
    console.error('Server error:', error);
    process.exit(1);
  }
}

// Initialize the database connection and start the server
void startServer();
