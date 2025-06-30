const express = require('express');
const User = require('../models/User');
const Group = require('../models/Group');
const Community = require('../models/Community');

const router = express.Router();

// Get public statistics
router.get('/', async (req, res) => {
  try {
    const [
      totalUsers,
      activeGroups,
      totalConnections
    ] = await Promise.all([
      User.countDocuments({ isBanned: false }),
      Group.countDocuments({ isActive: true }),
      User.aggregate([
        { $match: { isBanned: false } },
        { $project: { friendsCount: { $size: '$friends' } } },
        { $group: { _id: null, total: { $sum: '$friendsCount' } } }
      ])
    ]);

    res.json({
      totalUsers,
      activeGroups,
      totalConnections: totalConnections[0]?.total || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;