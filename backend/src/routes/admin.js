const express = require('express');
const User = require('../models/User');
const Group = require('../models/Group');
const Community = require('../models/Community');

const router = express.Router();

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all users (admin only)
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .select('name email age gender createdAt isBanned lastSeen currentGroup isOnline')
      .populate('currentGroup', 'community')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Ban user
router.post('/users/:id/ban', adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot ban yourself' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(400).json({ error: 'Cannot ban admin users' });
    }

    user.isBanned = true;
    user.isOnline = false;
    await user.save();

    // Remove user from any active group
    if (user.currentGroup) {
      await Group.findByIdAndUpdate(
        user.currentGroup,
        { $pull: { members: userId } }
      );
      user.currentGroup = null;
      await user.save();
    }

    // Remove from community queues
    if (user.inCommunityQueue) {
      await Community.findByIdAndUpdate(
        user.inCommunityQueue,
        { $pull: { queue: { user: userId } } }
      );
      user.inCommunityQueue = null;
      await user.save();
    }

    // Emit ban notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('user_banned', {
        message: 'Your account has been banned by an administrator'
      });
    }

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Unban user
router.post('/users/:id/unban', adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isBanned = false;
    await user.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// Get admin statistics
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [
      totalUsers,
      bannedUsers,
      activeGroups,
      totalGroups,
      totalCommunities
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      Group.countDocuments({ isActive: true }),
      Group.countDocuments(),
      Community.countDocuments({ isActive: true })
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      newUsersThisWeek,
      newGroupsThisWeek
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Group.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    res.json({
      totalUsers,
      bannedUsers,
      activeGroups,
      totalGroups,
      totalCommunities,
      newUsersThisWeek,
      newGroupsThisWeek
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;