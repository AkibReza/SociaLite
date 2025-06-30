const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// Get current user profile
router.get("/profile", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: "User profile not found" });
    }
    const user = await User.findById(req.user._id)
      .populate("currentGroup", "community phase expiresAt")
      .select("-__v");

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update user profile
router.put(
  "/profile",
  [
    body("name").optional().trim().isLength({ min: 1, max: 100 }),
    body("age").optional().isInt({ min: 18, max: 100 }),
    body("gender").optional().isIn(["male", "female", "other"]),
    body("preferSameGender").optional().isBoolean(),
  ],
  async (req, res) => {
    console.log("PUT /api/users/profile endpoint hit"); // Debug log
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, age, gender, preferSameGender } = req.body;
      const firebaseUser = req.firebaseUser;
      // Prepare update data
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (age !== undefined) updateData.age = age;
      if (gender !== undefined) updateData.gender = gender;
      if (preferSameGender !== undefined)
        updateData.preferSameGender = preferSameGender;

      // Only setOnInsert fields that are not in updateData
      const setOnInsert = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name:
          updateData.name === undefined ? firebaseUser.name || "" : undefined,
        age: updateData.age === undefined ? 18 : undefined,
        gender: updateData.gender === undefined ? "other" : undefined,
        preferSameGender:
          updateData.preferSameGender === undefined ? false : undefined,
      };
      // Remove undefined fields from setOnInsert
      Object.keys(setOnInsert).forEach(
        (key) => setOnInsert[key] === undefined && delete setOnInsert[key]
      );

      // Upsert: create if not exists, update if exists
      const user = await User.findOneAndUpdate(
        { firebaseUid: firebaseUser.uid },
        {
          $setOnInsert: setOnInsert,
          $set: updateData,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      ).select("-__v");

      res.json(user);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

// Search users (for admin or friend requests)
router.get("/search", async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res
        .status(400)
        .json({ error: "Search query must be at least 2 characters" });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        { isBanned: false }, // Exclude banned users
        {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        },
      ],
    })
      .select("name email _id")
      .limit(parseInt(limit));

    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
