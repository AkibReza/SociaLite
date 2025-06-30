const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  community: {
    type: String,
    required: true,
    trim: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  phase: {
    type: Number,
    default: 1,
    min: 1,
    max: 4
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
groupSchema.index({ expiresAt: 1 });
groupSchema.index({ isActive: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ createdAt: 1 });

// Virtual for days remaining
groupSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diffTime = this.expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Method to calculate current phase based on days elapsed
groupSchema.methods.updatePhase = function() {
  const now = new Date();
  const daysSinceCreation = Math.floor((now - this.createdAt) / (1000 * 60 * 60 * 24));
  
  let newPhase = 1;
  if (daysSinceCreation >= 21) newPhase = 4;
  else if (daysSinceCreation >= 14) newPhase = 3;
  else if (daysSinceCreation >= 7) newPhase = 2;
  
  if (newPhase !== this.phase) {
    this.phase = newPhase;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to check if group has expired
groupSchema.methods.checkExpiry = function() {
  const now = new Date();
  if (now >= this.expiresAt && this.isActive) {
    this.isActive = false;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to create a new group
groupSchema.statics.createGroup = async function(communityName, memberIds) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
  
  const group = new this({
    community: communityName,
    members: memberIds,
    expiresAt: expiresAt
  });
  
  return group.save();
};

module.exports = mongoose.model('Group', groupSchema);