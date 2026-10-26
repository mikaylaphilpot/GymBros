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

