const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate friendships
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ status: 1 });
friendshipSchema.index({ createdAt: -1 });

// Method to accept friendship
friendshipSchema.methods.accept = async function() {
  this.status = 'accepted';
  await this.save();
  
  // Add each user to the other's friends list
  const User = require('./User');
  await Promise.all([
    User.findByIdAndUpdate(this.requester, { $addToSet: { friends: this.recipient } }),
    User.findByIdAndUpdate(this.recipient, { $addToSet: { friends: this.requester } })
  ]);
  
  return this;
};

// Method to reject friendship
friendshipSchema.methods.reject = function() {
  this.status = 'rejected';
  return this.save();
};

// Static method to find existing friendship
friendshipSchema.statics.findExisting = function(user1Id, user2Id) {
  return this.findOne({
    $or: [
      { requester: user1Id, recipient: user2Id },
      { requester: user2Id, recipient: user1Id }
    ]
  });
};

module.exports = mongoose.model('Friendship', friendshipSchema);