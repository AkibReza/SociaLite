const express = require('express');
const Friendship = require('../models/Friendship');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get user's friends
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name email isOnline lastSeen')
      .lean();

    res.json(user.friends || []);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Get friend requests (received)
router.get('/requests', async (req, res) => {
  try {
    const requests = await Friendship.find({
      recipient: req.user._id,
      status: 'pending'
    })
    .populate('requester', 'name email')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// Send friend request
router.post('/request', [
  body('recipientId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId } = req.body;
    const requesterId = req.user._id;

    // Can't send request to yourself
    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient || recipient.isBanned) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findExisting(requesterId, recipientId);
    if (existingFriendship) {
      if (existingFriendship.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already sent' });
      }
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ error: 'You are already friends' });
      }
      if (existingFriendship.status === 'blocked') {
        return res.status(400).json({ error: 'Cannot send friend request' });
      }
    }

    // Create friend request
    const friendship = new Friendship({
      requester: requesterId,
      recipient: recipientId
    });

    await friendship.save();

    // Emit notification to recipient via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId.toString()).emit('friend_request', {
        from: {
          _id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept/reject friend request
router.post('/requests/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const friendship = await Friendship.findOne({
      _id: id,
      recipient: req.user._id,
      status: 'pending'
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (action === 'accept') {
      await friendship.accept();
    } else {
      await friendship.reject();
    }

    // Emit notification to requester via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(friendship.requester.toString()).emit('friend_request_response', {
        action,
        from: {
          _id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({ message: `Friend request ${action}ed successfully` });
  } catch (error) {
    console.error('Friend request response error:', error);
    res.status(500).json({ error: `Failed to ${req.params.action} friend request` });
  }
});

// Remove friend
router.delete('/:id', async (req, res) => {
  try {
    const friendId = req.params.id;
    const userId = req.user._id;

    // Remove friendship record
    await Friendship.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ],
      status: 'accepted'
    });

    // Remove from both users' friends lists
    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { friends: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { friends: userId } })
    ]);

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

module.exports = router;