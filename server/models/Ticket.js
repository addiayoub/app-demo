const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'closed'],
    default: 'open'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  }],
  replies: [{
    content: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
      
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    attachments: [{
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      path: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isReadByAdmin: {
    type: Boolean,
    default: false
  },
  isReadByUser: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour les recherches
ticketSchema.index({ subject: 'text', message: 'text' });
ticketSchema.index({ status: 1 });
ticketSchema.index({ user: 1 });
ticketSchema.index({ admin: 1 });
ticketSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);