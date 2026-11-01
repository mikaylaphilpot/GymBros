const express = require('express');
const router = express.Router();
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware.js');


// POST /api/auth/signup
// Registers a new user after validating their username, email, and password.
// Prevents duplicate accounts and hashes passwords before saving to MongoDB.
// Returns 201 on success or an appropriate error status on failure.
router.post('/signup', async (req, res) => {

    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    // Validate that all required fields are provided
    if (typeof username !== "string" || 
        username.trim().length === 0 || 
        typeof email !== "string" || 
        email.trim().length === 0 || 
        typeof password !== "string" ||
         password.trim().length === 0) {
        return res.status(400).json({ message: 'Please fill out all fields!' });
    }

    // Normalize username and email 
    // They are case-insentive
    const normUsername = username.trim().toLowerCase();
    const normEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normEmail)) {
        return res.status(400).json({ message: 'Invalid Email Format' })
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'Your Password does not meet requirements' })
    }

    try {

        // Check whether the email or username already exists

        const existingEmail = await User.findOne({ email: normEmail })

        if (existingEmail !== null) {
            return res.status(409).json({ message: 'Account already exists with this email' });
        }

        const existingUser = await User.findOne({ username: normUsername })

        if (existingUser !== null) {
            return res.status(409).json({ message: 'Username already in use' });
        }

        // Hash the password before storing it in DB
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create the new user account
        await User.create({
            username: normUsername,
            email: normEmail,
            password: hashedPassword
        });

    } catch (error) {

        // Handle duplicate key errors and unexpected database errors

        if (error.code === 11000) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }

        console.error('Signup error:', error);
        return res.status(500).json({ message: 'Internal server error' });

    }



    res.status(201).json({ message: 'User signed up successfully!' });
});

// POST /api/auth/login
// Authenticates a user using their username and password.
// Generates a signed JWT valid for 1 hour after successful login.
// Returns the token to the frontend for authenticated requests.
router.post('/login', async (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    if (typeof username !== "string" || username.trim().length === 0 || typeof password !== "string" || password.trim().length === 0) {
        return res.status(400).json({ message: 'Please fill out all fields!' });
    }

    //username and email are case-insentive
    const normUsername = username.trim().toLowerCase();


    try {

        // Find the user by their normalized username
        const existingUser = await User.findOne({ username: normUsername })

        if (existingUser === null) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Compare the submitted password against the stored bcrypt hash
        const passwordMatches = await bcrypt.compare(password, existingUser.password);

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate a JWT containing the authenticated user's MongoDB ID
        const token = jwt.sign(
            { userId: existingUser._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '1h'}
        );

        // Return the token to the frontend
        res.status(200).json({ message: 'User logged in successfully!', token: token });


    } catch (error) {

        console.error('Login error:', error);
        return res.status(500).json({ message: 'Database/server connection error' })

    }



    
});

// GET /api/auth/me
// Protected route requiring a valid JWT in the Authorization header.
// Uses the authenticated user ID to retrieve their account from MongoDB.
// Returns the user's ID, username, and email without exposing their password.
router.get('/me', authMiddleware, async (req, res) => {

    try{
    
    // Find the authenticated user using the ID provided by authMiddleware
    const existingUser = await User.findById(req.userId)

    // Handle accounts that no longer exist
    if(existingUser === null){
        return res.status(404).json({message: 'User not found'});
    }

    // Return only the user information needed by the frontend
    return res.status(200).json({id: existingUser._id, username: existingUser.username, email: existingUser.email});

    }catch(error){

        console.error('Internal error', error);
        return res.status(500).json({ message: 'Internal server error' })
    }
});



module.exports = router;