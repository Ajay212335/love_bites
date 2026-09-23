const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      default: function () {
        return `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(this.name || 'User')}`;
      },
    },
    bio: {
      type: String,
      default: 'Exploring sweet culinary moments & date nights ✨',
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    partnerName: {
      type: String,
      default: null,
    },
    partnerEmail: {
      type: String,
      default: null,
    },
    anniversaryDate: {
      type: String,
      default: null,
    },
    pushToken: {
      type: String,
      default: null,
    },
    fcmToken: {
      type: String,
      default: null,
    },
  },
  {
    collection: 'user', // Explicitly matches MongoDB Atlas collection 'user'
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);
