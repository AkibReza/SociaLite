const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  icon: {
    type: String,
    required: true,
    maxlength: 10
  },
  queue: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalMembers: {
    type: Number,
    default: 0
  },
  totalGroups: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
communitySchema.index({ name: 1 });
communitySchema.index({ isActive: 1 });
communitySchema.index({ 'queue.user': 1 });

// Virtual for queue count
communitySchema.virtual('queueCount').get(function() {
  return this.queue.length;
});

// Method to add user to queue
communitySchema.methods.addToQueue = function(userId) {
  if (!this.queue.some(item => item.user.toString() === userId.toString())) {
    this.queue.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove user from queue
communitySchema.methods.removeFromQueue = function(userId) {
  this.queue = this.queue.filter(item => item.user.toString() !== userId.toString());
  return this.save();
};

// Method to get next batch for group creation
communitySchema.methods.getNextBatch = function(genderPreference = null) {
  const availableUsers = this.queue.slice(0, 10);
  
  if (availableUsers.length >= 10) {
    // Remove these users from queue
    this.queue = this.queue.slice(10);
    return availableUsers.map(item => item.user);
  }
  
  return null;
};

module.exports = mongoose.model('Community', communitySchema);