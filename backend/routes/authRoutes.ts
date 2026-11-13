import express, { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import authMiddleware from '../middleware/authMiddleware';
import sendEmail from '../utils/sendEmail';

interface SignupBody {
  username: unknown;
  email: unknown;
  password: unknown;
}

// Request values start as unknown because clients can send values of any shape.
// The runtime checks in each route prove they are strings before we use them.
interface LoginBody {
  identifier?: unknown;
  email?: unknown;
  username?: unknown;
  password: unknown;
}

interface EmailBody {
  email: unknown;
}

interface ResetPasswordBody {
  token: unknown;
  password: unknown;
}

interface UpdateProfileBody {
  name: unknown;
  username: unknown;
  currentPassword: unknown;
  password: unknown;
}

const router = express.Router();
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const verificationLinkFor = (token: string): string =>
  `${process.env.PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/verify-email?token=${token}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// MongoDB reports duplicate unique-index values with error code 11000.
function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

// POST /api/auth/signup
// Registers a user after validating their username, email, and password.
// Duplicate accounts are rejected and passwords are hashed before saving.
// A verification email is sent after the account is created.
router.post('/signup', async (req: Request<Record<string, never>, unknown, SignupBody>, res: Response) => {
  const body: unknown = req.body;
  if (!isRecord(body)) {
    res.status(400).json({ message: 'Please provide valid signup details.' });
    return;
  }

  const { username, email, password } = body;

  if (
    typeof username !== 'string' || username.trim().length === 0 ||
    typeof email !== 'string' || email.trim().length === 0 ||
    typeof password !== 'string' || password.trim().length === 0
  ) {
    res.status(400).json({ message: 'Please fill out all fields!' });
    return;
  }

  // Preserve email and username casing; both are case-sensitive identifiers.
  const exactUsername = username.trim();
  const exactEmail = email.trim();

  if (!emailRegex.test(exactEmail)) {
    res.status(400).json({ message: 'Invalid Email Format' });
    return;
  }

  if (!passwordRegex.test(password)) {
    res.status(400).json({ message: 'Your Password does not meet requirements' });
    return;
  }

  try {
    // Check whether the email or username already exists.
    if (await User.findOne({ email: exactEmail })) {
      res.status(409).json({ message: 'Account already exists with this email' });
      return;
    }

    if (await User.findOne({ username: exactUsername })) {
      res.status(409).json({ message: 'Username already in use' });
      return;
    }

    // Keep only a hash of the verification token in the database.
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Hash the password before storing the new account.
    await User.create({
      username: exactUsername,
      email: exactEmail,
      password: hashedPassword,
      verificationToken: hashedVerificationToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await sendEmail(
      exactEmail,
      'Verify your GymBros account',
      `Click this link to verify your email: ${verificationLinkFor(verificationToken)}`
    );
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ message: 'Username or email already exists' });
      return;
    }

    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }

  res.status(201).json({ message: 'User signed up successfully!' });
});

// Login returns a one-hour JWT after checking the password and email status.
// POST /api/auth/login
// Authenticates a user and returns a JWT that expires after one hour.
router.post('/login', async (req: Request<Record<string, never>, unknown, LoginBody>, res: Response) => {
  const body: unknown = req.body;
  if (!isRecord(body)) {
    res.status(400).json({ message: 'Please provide valid login details.' });
    return;
  }

  const { identifier: suppliedIdentifier, email, username, password } = body;
  const identifier = typeof suppliedIdentifier === 'string'
    ? suppliedIdentifier
    : typeof email === 'string'
      ? email
      : username;

  if (
    typeof identifier !== 'string' || identifier.trim().length === 0 ||
    typeof password !== 'string' || password.trim().length === 0
  ) {
    res.status(400).json({ message: 'Please fill out all fields!' });
    return;
  }

  // Accept email or username, while retaining support for older API clients.
  try {
    const exactIdentifier = identifier.trim();
    const lookup = emailRegex.test(exactIdentifier)
      ? { email: exactIdentifier }
      : { username: exactIdentifier };
    const existingUser = await User.findOne(lookup);

    // Compare the submitted password with its stored bcrypt hash.
    if (!existingUser || !(await bcrypt.compare(password, existingUser.password))) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    if (!existingUser.isVerified) {
      res.status(403).json({ message: 'Please verify your email before logging in.' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not set.');
    }

    // The JWT carries the user's MongoDB ID for protected routes.
    const token = jwt.sign(
      { userId: existingUser._id.toString() },
      jwtSecret,
      { expiresIn: '1h' }
    );
    res.status(200).json({ message: 'User logged in successfully!', token });
  } catch (error: unknown) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Database/server connection error' });
  }
});

// GET /api/auth/me
// Requires a valid JWT. authMiddleware attaches its verified user ID to req.
// Returns only public profile fields, never the password hash.
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ message: 'Token Verification Failed' });
    return;
  }

  try {
    const existingUser = await User.findById(req.userId);

    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      id: existingUser._id,
      name: existingUser.name,
      username: existingUser.username,
      email: existingUser.email
    });
  } catch (error: unknown) {
    console.error('Internal error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/auth/me
// Updates the authenticated user's name, username, and password. The current
// password is required for every profile change.
router.patch('/me', authMiddleware, async (
  req: Request<Record<string, never>, unknown, UpdateProfileBody>,
  res: Response
) => {
  if (!req.userId) {
    res.status(401).json({ message: 'Token Verification Failed' });
    return;
  }

  const { name, username, currentPassword, password } = req.body;

  if (
    typeof name !== 'string' || name.trim().length === 0 ||
    typeof username !== 'string' || username.trim().length === 0 ||
    typeof currentPassword !== 'string' || currentPassword.length === 0 ||
    (password !== undefined && typeof password !== 'string')
  ) {
    res.status(400).json({ message: 'Name, username, and current password are required. A new password is optional.' });
    return;
  }

  const normalizedName = name.trim();
  const normalizedUsername = username.trim().toLowerCase();

  if (normalizedName.length > 100) {
    res.status(400).json({ message: 'Name must be 100 characters or fewer.' });
    return;
  }

  if (typeof password === 'string' && !passwordRegex.test(password)) {
    res.status(400).json({ message: 'Your Password does not meet requirements' });
    return;
  }

  try {
    const existingUser = await User.findById(req.userId);

    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!(await bcrypt.compare(currentPassword, existingUser.password))) {
      res.status(401).json({ message: 'Current password is incorrect.' });
      return;
    }

    const usernameOwner = await User.findOne({
      username: normalizedUsername,
      _id: { $ne: existingUser._id }
    });

    if (usernameOwner) {
      res.status(409).json({ message: 'Username already in use' });
      return;
    }

    existingUser.name = normalizedName;
    existingUser.username = normalizedUsername;
    if (typeof password === 'string') {
      existingUser.password = await bcrypt.hash(password, 12);
    }
    await existingUser.save();

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: existingUser._id,
        name: existingUser.name,
        username: existingUser.username,
        email: existingUser.email
      }
    });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ message: 'Username already in use' });
      return;
    }

    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Unable to update profile.' });
  }
});

// GET /api/auth/verify-email
// Hashes the emailed token before looking it up and marks it as used on success.
router.get('/verify-email', async (req: Request, res: Response) => {
  const token: unknown = req.query.token;

  if (typeof token !== 'string' || token.length === 0) {
    res.status(400).json({ message: 'Invalid verification token.' });
    return;
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const existingUser = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!existingUser) {
      res.status(400).json({ message: 'Invalid or expired verification token' });
      return;
    }

    existingUser.isVerified = true;
    existingUser.verificationToken = null;
    existingUser.verificationTokenExpires = null;
    await existingUser.save();

    res.status(200).json({ message: 'Email verified successfully!' });
  } catch (error: unknown) {
    console.error('Email verification error', error);
    res.status(500).json({ message: 'Email verification error' });
  }
});

// POST /api/auth/resend-verification
// Accepts an email address, then rotates the token for an
// unverified account and emails the new link.
router.post('/resend-verification', async (
  req: Request<Record<string, never>, unknown, EmailBody>,
  res: Response
) => {
  const { email } = req.body;

  if (typeof email !== 'string' || email.trim().length === 0) {
    res.status(400).json({ message: 'Invalid email address' });
    return;
  }

  const exactEmail = email.trim();
  const genericMessage = 'If an unverified account exists, a verification email will be sent.';

  try {
    const existingUser = await User.findOne({ email: exactEmail });

    // Return the same message for an unknown or already-verified account.
    if (!existingUser || existingUser.isVerified) {
      res.status(existingUser ? 200 : 404).json({ message: genericMessage });
      return;
    }

    // Create a new token so any previously emailed link can no longer be used.
    const verificationToken = crypto.randomBytes(32).toString('hex');
    existingUser.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    existingUser.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await existingUser.save();

    await sendEmail(
      exactEmail,
      'Verify your GymBros account',
      `Click this link to verify your email: ${verificationLinkFor(verificationToken)}`
    );

    res.status(200).json({ message: genericMessage });
  } catch (error: unknown) {
    console.error('Email verification error', error);
    res.status(500).json({ message: 'Email verification error' });
  }
});

// POST /api/auth/forgot-password
// Emails a one-hour password-reset link when an account exists.
router.post('/forgot-password', async (
  req: Request<Record<string, never>, unknown, EmailBody>,
  res: Response
) => {
  const { email } = req.body;

  if (typeof email !== 'string' || email.trim().length === 0) {
    res.status(400).json({ message: 'Incomplete or invalid fields' });
    return;
  }

  // Preserve email casing when looking up the account.
  const exactEmail = email.trim();
  const genericMessage = 'If an account exists for this email, a password reset link will be sent.';

  try {
    const existingUser = await User.findOne({ email: exactEmail });

    if (!existingUser) {
      res.status(200).json({ message: genericMessage });
      return;
    }

    // Store only a hash of the reset token and set a one-hour expiration.
    const resetToken = crypto.randomBytes(32).toString('hex');
    existingUser.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    existingUser.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await existingUser.save();

    // For local testing; replace this URL with the frontend reset-password page.
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    await sendEmail(
      exactEmail,
      'Forget Password Link',
      `Click here to reset your password: ${resetLink}`
    );

    res.status(200).json({ message: genericMessage });
  } catch (error: unknown) {
    console.error('Forget password error', error);
    res.status(500).json({ message: 'Password error' });
  }
});

// POST /api/auth/reset-password
// Validates the emailed token, hashes the new password, and clears the token.
// The user is not automatically logged in after a password reset.
router.post('/reset-password', async (
  req: Request<Record<string, never>, unknown, ResetPasswordBody>,
  res: Response
) => {
  const { token, password } = req.body;

  if (
    typeof token !== 'string' || token.trim().length === 0 ||
    typeof password !== 'string' || password.trim().length === 0
  ) {
    res.status(400).json({ message: 'Please fill out all fields!' });
    return;
  }

  if (!passwordRegex.test(password)) {
    res.status(400).json({ message: 'Your Password does not meet requirements' });
    return;
  }

  // Hash the incoming token to match the value stored in MongoDB.
  const hashedResetToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const existingUser = await User.findOne({
      resetPasswordToken: hashedResetToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!existingUser) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    // Replace the password with its bcrypt hash and invalidate the reset link.
    existingUser.password = await bcrypt.hash(password, 12);
    existingUser.resetPasswordToken = null;
    existingUser.resetPasswordExpires = null;
    await existingUser.save();

    res.status(200).json({ message: 'Password reset was successful' });
  } catch (error: unknown) {
    console.error('Password reset error', error);
    res.status(500).json({ message: 'Password reset error' });
  }
});

export default router;
