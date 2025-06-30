const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');

const socketHandlers = (io, socket) => {
  console.log(`User ${socket.userId} connected`);

  // Join user to their own room for private notifications
  socket.join(socket.userId);

  // Join group room if user is in a group
  socket.on('join_group', async (groupId) => {
    try {
      const user = await User.findOne({ firebaseUid: socket.userId });
      if (user && user.currentGroup && user.currentGroup.toString() === groupId) {
        socket.join(groupId);
        console.log(`User ${socket.userId} joined group ${groupId}`);
        
        // Notify other group members that user is online
        socket.to(groupId).emit('member_status_update', {
          userId: user._id,
          isOnline: true
        });
      }
    } catch (error) {
      console.error('Join group error:', error);
    }
  });

  // Leave group room
  socket.on('leave_group', async (groupId) => {
    socket.leave(groupId);
    console.log(`User ${socket.userId} left group ${groupId}`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.groupId).emit('user_typing', {
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.groupId).emit('user_typing', {
      userId: socket.userId,
      isTyping: false
    });
  });

  // Handle voice/video call signals
  socket.on('call_initiated', (data) => {
    socket.to(data.groupId).emit('call_initiated', {
      callType: data.callType, // 'audio' or 'video'
      initiator: socket.userId,
      roomId: data.roomId
    });
  });

  socket.on('call_joined', (data) => {
    socket.to(data.groupId).emit('call_joined', {
      userId: socket.userId,
      roomId: data.roomId
    });
  });

  socket.on('call_left', (data) => {
    socket.to(data.groupId).emit('call_left', {
      userId: socket.userId,
      roomId: data.roomId
    });
  });

  // Handle WebRTC signaling
  socket.on('webrtc_offer', (data) => {
    socket.to(data.targetUserId).emit('webrtc_offer', {
      offer: data.offer,
      from: socket.userId
    });
  });

  socket.on('webrtc_answer', (data) => {
    socket.to(data.targetUserId).emit('webrtc_answer', {
      answer: data.answer,
      from: socket.userId
    });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    socket.to(data.targetUserId).emit('webrtc_ice_candidate', {
      candidate: data.candidate,
      from: socket.userId
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User ${socket.userId} disconnected`);
    
    try {
      // Update user offline status
      const user = await User.findOne({ firebaseUid: socket.userId });
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();

        // Notify group members that user went offline
        if (user.currentGroup) {
          socket.to(user.currentGroup.toString()).emit('member_status_update', {
            userId: user._id,
            isOnline: false
          });
        }
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
};

module.exports = socketHandlers;