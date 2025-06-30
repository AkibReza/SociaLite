const express = require('express');
const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get current user's group
router.get('/current', async (req, res) => {
  try {
    if (!req.user.currentGroup) {
      return res.status(404).json({ error: 'You are not in any group' });
    }

    const group = await Group.findById(req.user.currentGroup)
      .populate('members', 'name email isOnline')
      .lean();

    if (!group) {
      // Clear the user's currentGroup if group doesn't exist
      await User.findByIdAndUpdate(req.user._id, { currentGroup: null });
      return res.status(404).json({ error: 'Group not found' });
    }

    // Update group phase and check expiry
    const groupDoc = await Group.findById(group._id);
    await groupDoc.updatePhase();
    await groupDoc.checkExpiry();

    // Get updated group data
    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email isOnline')
      .lean();

    res.json(updatedGroup);
  } catch (error) {
    console.error('Get current group error:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Get group messages
router.get('/current/messages', async (req, res) => {
  try {
    if (!req.user.currentGroup) {
      return res.status(404).json({ error: 'You are not in any group' });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ group: req.user.currentGroup })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message to group
router.post('/:id/messages', [
  body('content').trim().isLength({ min: 1, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const groupId = req.params.id;
    const { content } = req.body;

    // Verify user is member of this group
    if (req.user.currentGroup?.toString() !== groupId) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({ error: 'Group not found or inactive' });
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      group: groupId,
      content: content
    });

    await message.save();

    // Populate sender info
    await message.populate('sender', 'name');

    // Update group message count
    group.messageCount += 1;
    await group.save();

    // Emit message to group members via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(groupId).emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get group members (for phase 4 - personal messaging)
router.get('/current/members', async (req, res) => {
  try {
    if (!req.user.currentGroup) {
      return res.status(404).json({ error: 'You are not in any group' });
    }

    const group = await Group.findById(req.user.currentGroup);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if personal messaging is unlocked (Phase 4)
    await group.updatePhase();
    
    if (group.phase < 4) {
      return res.status(403).json({ error: 'Personal messaging not yet unlocked' });
    }

    const members = await User.find({ 
      _id: { $in: group.members },
      _id: { $ne: req.user._id } // Exclude current user
    }).select('name email isOnline lastSeen');

    res.json(members);
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
});

module.exports = router;