const express = require('express');
const cors = require('cors');
const router = require('./routes/authRoutes');
const { connectToMongoDB } = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

//Test API
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.use('/api/auth', router);

async function startServer() {

  try {

    await connectToMongoDB();

    app.listen(5001, () => {
      console.log('Server running on port 5001');
    });

  } catch (error) {
    console.error('Server error:', error);
    process.exit(1);
  }



}

startServer();
