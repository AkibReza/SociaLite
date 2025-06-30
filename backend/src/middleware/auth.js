const admin = require("firebase-admin");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  console.log("authMiddleware called for", req.method, req.originalUrl);
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Find user in database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (user && user.isBanned) {
      console.log("User is banned:", user._id);
      return res.status(403).json({ error: "User is banned" });
    }

    // Update user's last seen and online status if user exists
    if (user) {
      user.lastSeen = new Date();
      user.isOnline = true;
      await user.save();
    }

    req.user = user || null;
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;
