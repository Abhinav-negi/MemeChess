import express from 'express';
import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
import User from '../modules/User.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
try {
const { username, password } = req.body;

// Validate
if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
}

if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be 3-20 characters' });
}

if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
}

// Check if username exists
const existing = await User.findOne({ username: username.toLowerCase() });
if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
}

// Create user
const user = new User({
    username: username.toLowerCase(),
    passwordHash: password  // Will be hashed by pre-save hook
});

await user.save();

// Generate JWT
const token = jwt.sign(
    { userId: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

res.json({
    token,
    username: user.username,
    stats: user.stats
});

} catch (err) {
console.error('Signup error:', err);
res.status(500).json({ error: 'Server error' });
}
});

// Login
router.post('/login', async (req, res) => {
try {
const { username, password } = req.body;

// Find user
const user = await User.findOne({ username: username.toLowerCase() });
if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
}

// Check password
const isValid = await user.comparePassword(password);
if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
}

// Update last login
user.lastLogin = new Date();
await user.save();

// Generate JWT
const token = jwt.sign(
    { userId: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

res.json({
    token,
    username: user.username,
    stats: user.stats
});

} catch (err) {
console.error('Login error:', err);
res.status(500).json({ error: 'Server error' });
}
});

// Verify token (for auto-login)
router.get('/verify', async (req, res) => {
try {
const token = req.headers.authorization?.split(' ')[1];

if (!token) {
    return res.status(401).json({ error: 'No token' });
}

const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findOne({ username: decoded.userId });

if (!user) {
    return res.status(401).json({ error: 'User not found' });
}

res.json({
    username: user.username,
    stats: user.stats
});

} catch (err) {
res.status(401).json({ error: 'Invalid token' });
}
});

export default router;