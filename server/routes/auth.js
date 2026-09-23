const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');

const JWT_SECRET = process.env.JWT_SECRET || 'love_bites_secret_jwt_key_2026';

// Helper: Generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPartnerAddedEmail,
  sendPartnerLinkedConfirmationToUser,
} = require('../utils/email');
const { sendFirebasePushNotification } = require('../utils/firebasePush');

/**
 * @route POST /api/auth/send-otp
 * @desc Generate and send OTP for email verification
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email is already registered. Please log in.',
      });
    }

    // Generate 6-digit OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Hash password if provided
    let hashedPassword = '';
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Delete any prior OTP for this email
    await Otp.deleteMany({ email: trimmedEmail });

    // Store new OTP
    await Otp.create({
      email: trimmedEmail,
      otp: otpCode,
      name: name ? name.trim() : '',
      password: hashedPassword,
      expiresAt,
    });

    // Send email via Nodemailer
    await sendOtpEmail(trimmedEmail, otpCode, name || 'Love Bites User');

    return res.json({
      success: true,
      message: `Verification code sent to ${trimmedEmail}. Please check your email inbox.`,
    });
  } catch (error) {
    console.error('send-otp error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send OTP. Server error.' });
  }
});

/**
 * @route POST /api/auth/verify-otp-signup
 * @desc Verify OTP and create new dynamic user account
 */
router.post('/verify-otp-signup', async (req, res) => {
  try {
    const { email, otp, name, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP code are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    // Find OTP record
    const otpRecord = await Otp.findOne({
      email: trimmedEmail,
      otp: trimmedOtp,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP. Please request a new code.',
      });
    }

    // Check if user got created in between
    let user = await User.findOne({ email: trimmedEmail });
    if (user) {
      return res.status(400).json({ success: false, error: 'Account already exists.' });
    }

    // Determine password
    const finalPassword =
      otpRecord.password ||
      (password ? await bcrypt.hash(password, 10) : await bcrypt.hash('lovebites123', 10));

    const finalName = name?.trim() || otpRecord.name || trimmedEmail.split('@')[0];

    // Create user dynamically in MongoDB Atlas
    user = await User.create({
      name: finalName,
      email: trimmedEmail,
      password: finalPassword,
    });

    // Delete verified OTP
    await Otp.deleteMany({ email: trimmedEmail });

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '30d',
    });

    const userJson = user.toJSON();

    // Send Welcome / Registration confirmation email
    sendWelcomeEmail(trimmedEmail, finalName).catch((e) =>
      console.warn('Could not send welcome email:', e.message)
    );

    return res.json({
      success: true,
      message: 'Account successfully registered and verified!',
      user: userJson,
      token,
    });
  } catch (error) {
    console.error('verify-otp-signup error:', error);
    return res.status(500).json({ success: false, error: 'Verification failed. Server error.' });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate with Email and Password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'No account found with this email. Please sign up with OTP.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Incorrect password. Please try again.' });
    }

    // Populate partner details if paired
    let partner = null;
    if (user.partnerId) {
      const partnerDoc = await User.findById(user.partnerId);
      if (partnerDoc) {
        partner = partnerDoc.toJSON();
      }
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '30d',
    });

    return res.json({
      success: true,
      message: 'Logged in successfully',
      user: user.toJSON(),
      partner,
      token,
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed. Server error.' });
  }
});

/**
 * @route POST /api/auth/partner/link
 * @desc Link another user (partner) by their Email and Password
 */
router.post('/partner/link', async (req, res) => {
  try {
    const { currentUserId, partnerEmail, partnerPassword, partnerName } = req.body;

    if (!currentUserId || !partnerEmail || !partnerPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current user ID, partner email, and partner password are required.',
      });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'Current user account not found.' });
    }

    const trimmedPartnerEmail = partnerEmail.trim().toLowerCase();
    if (trimmedPartnerEmail === currentUser.email.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'You cannot link yourself as your partner.' });
    }

    let partnerUser = await User.findOne({ email: trimmedPartnerEmail });
    const nameToUse = partnerName?.trim() || trimmedPartnerEmail.split('@')[0];

    if (!partnerUser) {
      // Create partner account dynamically in DB
      const hashedPassword = await bcrypt.hash(partnerPassword, 10);

      partnerUser = await User.create({
        name: nameToUse,
        email: trimmedPartnerEmail,
        password: hashedPassword,
        partnerId: currentUser._id,
        partnerName: currentUser.name,
        partnerEmail: currentUser.email,
        anniversaryDate: new Date().toISOString().split('T')[0],
      });
    } else {
      // Validate partner password
      const isMatch = await bcrypt.compare(partnerPassword, partnerUser.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: 'Partner password does not match the registered account.',
        });
      }

      // If user typed a specific custom partner name, update it
      if (partnerName && partnerName.trim()) {
        partnerUser.name = partnerName.trim();
      }

      // Link partner to current user
      partnerUser.partnerId = currentUser._id;
      partnerUser.partnerName = currentUser.name;
      partnerUser.partnerEmail = currentUser.email;
      await partnerUser.save();
    }

    // Link current user to partner
    currentUser.partnerId = partnerUser._id;
    currentUser.partnerName = partnerUser.name;
    currentUser.partnerEmail = partnerUser.email;
    await currentUser.save();

    // 1. Send Partner Added notification email to the partner's email address
    sendPartnerAddedEmail(
      trimmedPartnerEmail,
      partnerUser.name,
      currentUser.name,
      currentUser.email
    ).catch((e) => console.warn('Could not send partner linked email:', e.message));

    // 2. Send Partner Linked confirmation email to the current user's email address
    sendPartnerLinkedConfirmationToUser(
      currentUser.email,
      currentUser.name,
      partnerUser.name,
      trimmedPartnerEmail
    ).catch((e) => console.warn('Could not send user confirmation email:', e.message));

    return res.json({
      success: true,
      message: `Successfully linked with partner ${partnerUser.name}!`,
      user: currentUser.toJSON(),
      partner: partnerUser.toJSON(),
    });
  } catch (error) {
    console.error('partner/link error:', error);
    return res.status(500).json({ success: false, error: 'Failed to link partner. Server error.' });
  }
});

/**
 * @route POST /api/auth/update-push-token
 * @desc Save or update device push token for Firebase notifications
 */
router.post('/update-push-token', async (req, res) => {
  try {
    const { userId, pushToken, fcmToken } = req.body;
    if (!userId || (!pushToken && !fcmToken)) {
      return res.status(400).json({ success: false, error: 'userId and pushToken required' });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { pushToken: pushToken || undefined, fcmToken: fcmToken || undefined } },
      { new: true }
    );

    console.log(`📱 [Push Token Registered] User [${userId}] linked to push token: ${pushToken || fcmToken}`);
    return res.json({ success: true, user: updated ? updated.toJSON() : null });
  } catch (error) {
    console.error('update-push-token error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update push token' });
  }
});

/**
 * @route POST /api/auth/push/nudge
 * @desc Send instant Firebase push notification to partner device
 */
router.post('/push/nudge', async (req, res) => {
  try {
    const { currentUserId, partnerId, taskTitle, taskTime } = req.body;
    if (!currentUserId || !partnerId) {
      return res.status(400).json({ success: false, error: 'currentUserId and partnerId required' });
    }

    const [sender, targetPartner] = await Promise.all([
      User.findById(currentUserId),
      User.findById(partnerId),
    ]);

    if (!targetPartner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    const senderName = sender?.name || 'Your partner';
    const notifTitle = `💖 ${senderName} nudged you!`;
    const notifBody = `Time for: "${taskTitle || 'Daily Couple Moment'}" at ${taskTime || 'now'}! ✨`;

    const pushResult = await sendFirebasePushNotification({
      pushToken: targetPartner.pushToken || targetPartner.fcmToken,
      title: notifTitle,
      body: notifBody,
      data: { type: 'partner_nudge', senderId: currentUserId, taskTitle, taskTime },
    });

    return res.json({
      success: true,
      message: `Push notification sent to ${targetPartner.name}!`,
      pushResult,
    });
  } catch (error) {
    console.error('push/nudge error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send partner push notification' });
  }
});

module.exports = router;
