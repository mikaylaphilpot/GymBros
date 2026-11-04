const express = require('express');
const router = express.Router();
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware.js');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail.js');


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

        // Create a random verification token and hash it
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        // Hash the password before storing it in DB
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create the new user account
        await User.create({
            username: normUsername,
            email: normEmail,
            password: hashedPassword,
            verificationToken: hashedVerificationToken,
            verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000

        });

        // Use the token to create your verification link
        const verificationLink = 'http://localhost:5001/api/auth/verify-email?token=' + verificationToken;

        // Send email to user with verification link whch will expire in 24 hours
        await sendEmail(
            normEmail,
            "Verify your GymBros account",
            "Click this link to verify your email: " + verificationLink
        );

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

        if (!existingUser.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        // Generate a JWT containing the authenticated user's MongoDB ID
        const token = jwt.sign(
            { userId: existingUser._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
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

    try {

        // Find the authenticated user using the ID provided by authMiddleware
        const existingUser = await User.findById(req.userId)

        // Handle accounts that no longer exist
        if (existingUser === null) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return only the user information needed by the frontend
        return res.status(200).json({ id: existingUser._id, username: existingUser.username, email: existingUser.email });

    } catch (error) {

        console.error('Internal error', error);
        return res.status(500).json({ message: 'Internal server error' })
    }
});

router.get('/verify-email', async (req, res) => {

    const token = req.query.token;

    if (!token || typeof token !== "string") {
        return res.status(400).json({
            message: 'Inalid verification token.'
        });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    try {

        const existingUser = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpires: { $gt: Date.now() }
        })

        if (existingUser === null) {
            return res.status(400).json({
                message: 'Invalid or expired verification token'
            })
        }

        existingUser.isVerified = true;
        existingUser.verificationToken = null;
        existingUser.verificationTokenExpires = null;

        await existingUser.save();

        return res.status(200).json({
            message: "Email verified successfully!"
        });




    } catch (error) {

        console.error('Email verification error', error);
        return res.status(500).json({ message: 'Email verification error' })

    }


});

//POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {

    // Accept the user's email address and normalize it
    const email = req.body.email;

    if (typeof email !== "string" || email.trim().length === 0) {
        return res.status(400).json({
            message: "Invalid email address"
        });
    }

    const normEmail = email.trim().toLowerCase();

    try {
        // Find the matching account in MongoDB.
        const existingUser = await User.findOne({
            email: normEmail
        });

        // Check wether user exists
        if (existingUser === null) {
            return res.status(404).json({
                message: "If an unverified account exists, a verification email will be sent."
            });
        }

        if (existingUser.isVerified) {
            return res.status(200).json({
                message: "If an unverified account exists, a verification email will be sent."
            });
        }

        // Generate a new verification token and hash it
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        // Save the new hashed token and new expiration
        existingUser.verificationToken = hashedVerificationToken;
        existingUser.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

        // Save updated variables to User
        await existingUser.save();

        // Use the token to create your new verification link
        const verificationLink = 'http://localhost:5001/api/auth/verify-email?token=' + verificationToken;

        // Send email to user with verification link whch will expire in 24 hours from now
        await sendEmail(
            normEmail,
            "Verify your GymBros account",
            "Click this link to verify your email: " + verificationLink
        );

        return res.status(200).json({
            message: "If an unverified account exists, a verification email will be sent."
        });


    } catch (error) {

        console.error('Email verification error', error);
        return res.status(500).json({ message: 'Email verification error' });

    }

});


router.post('/forgot-password', async (req, res) => {

    // Get the email from req.body
    const email = req.body.email;

    // Validate that email is a nonempty string
    if (typeof email !== "string" || email.trim().length === 0) {
        return res.status(400).json({
            message: "Incomplete or invalid fields"
        });
    }

    // Normalize the email
    const normEmail = email.trim().toLowerCase();

    try {

        // Find the user in MongoDB using their email
        const existingUser = await User.findOne({
            email: normEmail
        });

        if (existingUser === null) {
            return res.status(200).json({
                message: "If an account exists for this email, a password reset link will be sent."
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        existingUser.resetPasswordToken = hashedResetToken;
        existingUser.resetPasswordExpires = Date.now() + 60 * 60 * 1000

        await existingUser.save();

        // For local testing: http://localhost:5001/api/auth/reset-password?token=...
        // Replace with password-reset page for actuall implimentation
        const resetLink = 'http://localhost:5001/api/auth/reset-password?token=' + resetToken;

        await sendEmail(
            normEmail,
            "Forger Password Link",
            "Click here to reset your password: " + resetLink
        );

        return res.status(200).json({
            message: "If an account exists for this email, a password reset link will be sent."
        });

    } catch (error) {

        // Log the error for debugging and Return a 500 response for unexpected server errors
        console.error('Forget password error', error);
        return res.status(500).json({ message: 'Password error' });

    }
});



router.post('/reset-password', async (req, res) => {

    // Retrieve the reset token and new password from the request
    const resetToken = req.body.token;
    const password = req.body.password;

    // Validate that both values are nonempty strings
    if (typeof resetToken !== "string" || resetToken.trim().length === 0 || typeof password !== "string" || password.trim().length === 0) {
        return res.status(400).json({ message: 'Please fill out all fields!' });
    }

    // Validate the new password using your existing passwordRegex
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'Your Password does not meet requirements' })
    }

    // Hash the incoming reset token using SHA-256
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    try {

        // Find the user whose stored resetPasswordToken matches AND whose resetPasswordExpires is in the future
        const existingUser = await User.findOne({
            resetPasswordToken: hashedResetToken,
            resetPasswordExpires: { $gt: Date.now() }

        })

        // If no matching user exists, return 400
        // with an invalid or expired token message
        if (existingUser === null) {
            return res.status(400).json({
                message: "Invalid or expired token"
            });
        }

        // Hash the new password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 12);

        // Replace the user's stored password with the new hash
        existingUser.password = hashedPassword;

        // Clear resetPasswordToken and resetPasswordExpires
        existingUser.resetPasswordToken = null;
        existingUser.resetPasswordExpires = null;

        // 10. Save the updated user document in MongoDB
        await existingUser.save();

        // 11. Return 200 with a password reset success message
        // Do not automatically log the user in
        return res.status(200).json({ message: "Password reset was successful" })

    } catch (error) {

        // Log unexpected errors and Return 500 for internal server errors
        console.error('Password reset error', error);
        return res.status(500).json({ message: 'Password reset error' });
    }
});





module.exports = router;