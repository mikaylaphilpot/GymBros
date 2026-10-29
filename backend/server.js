const express = require('express');
const cors = require('cors');
const router = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

//Test API
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.use('/api/auth', router);

app.listen(5001, () => {
  console.log('Server running on port 5001');
});

// extra example code
// backend/server.js
// const express = require('express');
// const dotenv = require('dotenv');
// const { errorHandler } = require('./middleware/errorMiddleware');

// // Load environment variables from your .env file
// dotenv.config();

// const app = express();

// // Middleware to parse incoming JSON data
// app.use(express.json()); 
// app.use(express.urlencoded({ extended: false }));

// // Basic route to verify the server is running locally
// app.get('/api/status', (req, res) => {
//   res.status(200).json({ message: 'GymBros local server is running!' });
// });

// // Import and use your Notification Routes here later
// // app.use('/api/notifications', require('./routes/notificationRoutes'));

// // This MUST be the last middleware in the file to catch all errors
// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server started locally on port ${PORT}`)); 