const express = require('express');
const router = express.Router();
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

router.post('/signup', (req, res)=> {
    // Handle signup logic here
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if(typeof username !== "string" || !username || !username.trim() || typeof email !== "string" || !email  || !email.trim()|| typeof password !== "string"  || !password  || !password.trim()) {
        return res.status(400).json({ message: 'Please fill out all fields!' });
    }

    if(!emailRegex.test(email)){
        return res.status(400).json({ message: 'Invalid Email Format' });
    }

    if(!passwordRegex.test(password)){
        return res.status(400).json({message: 'Your Password does not meet requirements'})
    }

    

    res.json({ message: 'User signed up successfully!' });
});

module.exports = router;