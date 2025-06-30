const express = require('express');
const Community = require('../models/Community');
const User = require('../models/User');
const Group = require('../models/Group');

const router = express.Router();

// Get all communities with user's join status
router.get('/', async (req, res) => {
  try {
    const communities = await Community.find({ isActive: true })
      .select('name description icon queue totalMembers totalGroups');

    const communitiesWithStatus = communities.map(community => ({
      _id: community._id,
      name: community.name,
      description: community.description,
      icon: community.icon,
      queueCount: community.queue.length,
      totalMembers: community.totalMembers,
      isJoined: community.queue.some(item => item.user.toString() === req.user._id.toString())
    }));

    res.json(communitiesWithStatus);
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// Join community queue
router.post('/:id/join', async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user._id;

    // Check if user is already in a group
    if (req.user.currentGroup) {
      return res.status(400).json({ error: 'You are already in an active group' });
    }

    // Check if user is already in any queue
    if (req.user.inCommunityQueue) {
      return res.status(400).json({ error: 'You are already in a community queue' });
    }

    const community = await Community.findById(communityId);
    if (!community || !community.isActive) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is already in this community's queue
    const isAlreadyInQueue = community.queue.some(item => 
      item.user.toString() === userId.toString()
    );

    if (isAlreadyInQueue) {
      return res.status(400).json({ error: 'You are already in this community queue' });
    }

    // Add user to queue
    await community.addToQueue(userId);
    
    // Update user's queue status
    await User.findByIdAndUpdate(userId, { inCommunityQueue: communityId });

    // Check if we have enough users to create a group (10 users)
    if (community.queue.length >= 10) {
      const memberIds = community.getNextBatch();
      
      if (memberIds && memberIds.length === 10) {
        // Create new group
        const group = await Group.createGroup(community.name, memberIds);
        
        // Update all members' currentGroup and remove from queue
        await User.updateMany(
          { _id: { $in: memberIds } },
          { 
            currentGroup: group._id,
            inCommunityQueue: null
          }
        );

        // Update community stats
        community.totalGroups += 1;
        community.totalMembers += 10;
        await community.save();

        // Emit group creation event to all members
        const io = req.app.get('io');
        if (io) {
          memberIds.forEach(memberId => {
            io.to(memberId.toString()).emit('group_created', {
              groupId: group._id,
              community: community.name,
              message: 'You have been matched! Your group is ready.'
            });
          });
        }
      }
    }

    res.json({ message: 'Successfully joined community queue' });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({ error: 'Failed to join community' });
  }
});

// Leave community queue
router.post('/:id/leave', async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user._id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Remove user from queue
    await community.removeFromQueue(userId);
    
    // Update user's queue status
    await User.findByIdAndUpdate(userId, { inCommunityQueue: null });

    res.json({ message: 'Successfully left community queue' });
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({ error: 'Failed to leave community' });
  }
});

module.exports = router;