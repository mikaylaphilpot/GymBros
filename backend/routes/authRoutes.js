const express = require('express');
const router = express.Router();

router.post('/signup', (req, res)=> {
    // Handle signup logic here
    const email = req.body.email;
    res.json({ message: 'User signed up successfully!' });
});

module.exports = router;