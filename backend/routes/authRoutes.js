const express = require('express');
const router = express.Router();
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


router.post('/signup', async (req, res) => {
    // Handle signup logic here
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if (typeof username !== "string" || username.trim().length === 0 || typeof email !== "string" || email.trim().length === 0 || typeof password !== "string" || password.trim().length === 0) {
        return res.status(400).json({ message: 'Please fill out all fields!' });
    }

    //username and email are case-insentive
    const normUsername = username.trim().toLowerCase();
    const normEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normEmail)) {
        return res.status(400).json({ message: 'Invalid Email Format' })
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'Your Password does not meet requirements' })
    }

    try {
        const existingEmail = await User.findOne({ email: normEmail })

        if (existingEmail !== null) {
            return res.status(409).json({ message: 'Account already exists with this email' });
        }

        const existingUser = await User.findOne({ username: normUsername })

        if (existingUser !== null) {
            return res.status(409).json({ message: 'Username already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await User.create({
            username: normUsername,
            email: normEmail,
            password: hashedPassword
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }

        console.error('Signup error:', error);
        return res.status(500).json({ message: 'Internal server error' });

    }



    res.status(201).json({ message: 'User signed up successfully!' });
});

router.post('/login', async (req, res) => {
    // Handle login logic here
    const username = req.body.username;
    const password = req.body.password;

    if (typeof username !== "string" || username.trim().length === 0 || typeof password !== "string" || password.trim().length === 0) {
        return res.status(400).json({ message: 'Please fill out all fields!' });
    }

    //username and email are case-insentive
    const normUsername = username.trim().toLowerCase();


    try {

        const existingUser = await User.findOne({ username: normUsername })

        if (existingUser === null) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const passwordMatches = await bcrypt.compare(password, existingUser.password);

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { userId: existingUser._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '1h'}
        );

        res.status(200).json({ message: 'User logged in successfully!', token: token });


    } catch (error) {

        console.error('Login error:', error);
        return res.status(500).json({ message: 'Database/server connection error' })

    }



    
});


module.exports = router;