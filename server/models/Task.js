const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    time: {
      type: String,
      required: true,
    },
    hour: {
      type: Number,
      required: true,
    },
    minute: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['romance', 'cooking', 'morning', 'night', 'wellness', 'fun', 'custom'],
      default: 'romance',
    },
    assignedTo: {
      type: String,
      enum: ['me', 'partner', 'both'],
      default: 'both',
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creatorName: {
      type: String,
      default: 'You',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedByName: {
      type: String,
      default: null,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    attachedByName: {
      type: String,
      default: null,
    },
    date: {
      type: String,
      default: null,
    },
    lastNudgedAt: {
      type: Date,
      default: null,
    },
    streakCount: {
      type: Number,
      default: 1,
    },
  },
  {
    collection: 'task',
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Task', taskSchema);
