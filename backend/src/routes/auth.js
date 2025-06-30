const express = require('express');
const admin = require('firebase-admin');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Verify Firebase token and get/create user
router.post('/verify', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // Check if user exists in our database
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Create new user record
      user = new User({
        firebaseUid: uid,
        email: email,
        name: '', // Will be set during profile setup
        age: 0,
        gender: 'other'
      });
      await user.save();
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    res.json({
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        preferSameGender: user.preferSameGender,
        isAdmin: user.isAdmin,
        currentGroup: user.currentGroup,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Update user offline status
    req.user.isOnline = false;
    req.user.lastSeen = new Date();
    await req.user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;