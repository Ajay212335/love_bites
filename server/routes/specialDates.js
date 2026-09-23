const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SpecialDate = require('../models/SpecialDate');
const User = require('../models/User');

/**
 * @route GET /api/special-dates
 * @desc Get special dates strictly for the requesting user and their linked partner
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      // Never return all dates if no user is authenticated/specified
      return res.json({
        success: true,
        dates: [],
        specialDates: [],
      });
    }

    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }

    const coupleIds = [];
    if (user) {
      coupleIds.push(user._id);
      if (user.partnerId) {
        coupleIds.push(user.partnerId);
      }
    } else {
      coupleIds.push(userId);
    }

    // Query documents belonging specifically to this user or their linked partner
    const query = {
      $or: [
        { userId: { $in: coupleIds } },
        { partnerId: { $in: coupleIds } },
      ],
    };

    const dates = await SpecialDate.find(query).sort({ date: 1 });
    const formattedDates = dates.map((d) => d.toJSON());

    return res.json({
      success: true,
      dates: formattedDates,
      specialDates: formattedDates,
    });
  } catch (error) {
    console.error('get special dates error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch special dates' });
  }
});

/**
 * @route POST /api/special-dates
 * @desc Create a new special date strictly tied to user and partner
 */
router.post('/', async (req, res) => {
  try {
    const { title, date, notes, userId, partnerId, createdByName } = req.body;

    if (!title || !date) {
      return res.status(400).json({ success: false, error: 'Title and Date are required' });
    }

    let resolvedPartnerId = partnerId;
    let resolvedCreatedByName = createdByName || 'You';

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);
      if (user) {
        if (!resolvedPartnerId && user.partnerId) {
          resolvedPartnerId = user.partnerId;
        }
        if (!createdByName && user.name) {
          resolvedCreatedByName = user.name;
        }
      }
    }

    const newDate = await SpecialDate.create({
      title: title.trim(),
      date,
      notes: notes ? notes.trim() : '',
      userId: userId || undefined,
      partnerId: resolvedPartnerId || undefined,
      createdByName: resolvedCreatedByName,
    });

    const jsonDoc = newDate.toJSON();

    return res.json({
      success: true,
      date: jsonDoc,
      specialDate: jsonDoc,
    });
  } catch (error) {
    console.error('create special date error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create special date' });
  }
});

/**
 * @route DELETE /api/special-dates/:id
 * @desc Delete a special date from MongoDB
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await SpecialDate.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Special date deleted' });
  } catch (error) {
    console.error('delete special date error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete special date' });
  }
});

module.exports = router;
