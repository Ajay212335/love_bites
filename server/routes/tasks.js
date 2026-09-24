const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');

/**
 * @route GET /api/tasks
 * @desc Get all recurring tasks for user and their linked partner
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId query parameter is required' });
    }

    const identifiers = new Set([String(userId).trim()]);
    let user = null;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ email: String(userId).trim().toLowerCase() });
    }

    if (user) {
      identifiers.add(user._id.toString());
      if (user.email) identifiers.add(user.email.toLowerCase());

      // 1. Direct partner link on user object
      if (user.partnerId) identifiers.add(user.partnerId.toString());
      if (user.partnerEmail) identifiers.add(user.partnerEmail.toLowerCase());

      // 2. Bidirectional partner link (find partner account that links to this user)
      const partnerDoc = await User.findOne({
        $or: [
          { partnerId: user._id },
          { partnerEmail: user.email },
          ...(user.partnerId ? [{ _id: user.partnerId }] : []),
          ...(user.partnerEmail ? [{ email: user.partnerEmail }] : []),
        ],
      });

      if (partnerDoc) {
        identifiers.add(partnerDoc._id.toString());
        if (partnerDoc.email) identifiers.add(partnerDoc.email.toLowerCase());
        if (partnerDoc.partnerId) identifiers.add(partnerDoc.partnerId.toString());
        if (partnerDoc.partnerEmail) identifiers.add(partnerDoc.partnerEmail.toLowerCase());
      }
    }

    const idList = Array.from(identifiers);

    const tasks = await Task.find({
      $or: [
        { creatorId: { $in: idList } },
        { partnerId: { $in: idList } },
        { creatorEmail: { $in: idList } },
        { partnerEmail: { $in: idList } },
      ],
    }).sort({ hour: 1, minute: 1 });

    const todayDateStr = new Date().toISOString().split('T')[0];

    // Format tasks for today's recurring state
    const formattedTasks = tasks.map((t) => {
      const taskObj = t.toJSON();
      const lastCompletedDate = taskObj.completedAt
        ? new Date(taskObj.completedAt).toISOString().split('T')[0]
        : taskObj.date || null;

      // Completed today vs completed on prior day (recurring daily ritual)
      const isCompletedToday = taskObj.isCompleted && lastCompletedDate === todayDateStr;

      return {
        ...taskObj,
        isCompleted: isCompletedToday,
        photoUrl: isCompletedToday ? taskObj.photoUrl : null,
        lastPhotoUrl: taskObj.photoUrl || taskObj.lastPhotoUrl,
        date: todayDateStr,
      };
    });

    return res.json({
      success: true,
      tasks: formattedTasks,
    });
  } catch (error) {
    console.error('get tasks error:', error);
    return res.json({ success: true, tasks: [] });
  }
});

/**
 * @route POST /api/tasks
 * @desc Create new daily recurring task
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      time,
      hour,
      minute,
      category,
      assignedTo,
      creatorId,
      creatorEmail,
      partnerId,
      partnerEmail,
      photoUrl,
      attachedByName,
      date,
    } = req.body;

    if (!title || !time || hour === undefined || minute === undefined || !creatorId) {
      return res.status(400).json({ success: false, error: 'Missing required task fields' });
    }

    let user = null;
    if (mongoose.Types.ObjectId.isValid(creatorId)) {
      user = await User.findById(creatorId);
    }
    if (!user) {
      user = await User.findOne({ email: String(creatorId).trim().toLowerCase() });
    }

    const resolvedCreatorId = user ? user._id.toString() : creatorId;
    const resolvedCreatorName = user ? user.name : (attachedByName || 'You');
    const resolvedCreatorEmail = user?.email || (creatorEmail ? creatorEmail.trim().toLowerCase() : null);
    const resolvedPartnerId = user?.partnerId ? user.partnerId.toString() : (partnerId || null);
    const resolvedPartnerEmail = user?.partnerEmail ? user.partnerEmail.toLowerCase() : (partnerEmail ? partnerEmail.trim().toLowerCase() : null);

    const todayDate = date || new Date().toISOString().split('T')[0];

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      time,
      hour,
      minute,
      category: category || 'romance',
      assignedTo: assignedTo || 'both',
      creatorId: resolvedCreatorId,
      creatorName: resolvedCreatorName,
      creatorEmail: resolvedCreatorEmail,
      partnerId: resolvedPartnerId,
      partnerEmail: resolvedPartnerEmail,
      photoUrl: photoUrl || null,
      lastPhotoUrl: photoUrl || null,
      attachedByName: attachedByName || null,
      date: todayDate,
      streakCount: 1,
      history: photoUrl
        ? [
            {
              date: todayDate,
              photoUrl,
              completedByName: attachedByName || 'You',
              completedAt: new Date(),
            },
          ]
        : [],
    });

    return res.json({
      success: true,
      task: task.toJSON(),
    });
  } catch (error) {
    console.error('create task error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

/**
 * Helper to find task by id or _id
 */
async function findTaskById(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const task = await Task.findById(id);
    if (task) return task;
  }
  return await Task.findOne({ _id: id });
}

/**
 * @route PUT /api/tasks/:id/complete-with-photo
 * @desc Complete task with attached photo proof for today in DB
 */
router.put('/:id/complete-with-photo', async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl, userName } = req.body;

    const task = await findTaskById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    task.isCompleted = true;
    task.photoUrl = photoUrl || task.photoUrl;
    task.lastPhotoUrl = photoUrl || task.photoUrl;
    task.attachedByName = userName || 'Partner';
    task.completedAt = now;
    task.completedByName = userName || 'Partner';
    task.date = todayStr;
    task.streakCount = (task.streakCount || 0) + 1;

    if (!task.history) task.history = [];
    task.history.push({
      date: todayStr,
      photoUrl: photoUrl || task.photoUrl,
      completedByName: userName || 'Partner',
      completedAt: now,
    });

    await task.save();

    return res.json({
      success: true,
      task: task.toJSON(),
    });
  } catch (error) {
    console.error('complete with photo error:', error);
    return res.status(500).json({ success: false, error: 'Failed to complete task' });
  }
});

/**
 * @route POST /api/tasks/:id/photo
 * @desc Attach or update photo proof for task in DB
 */
router.post('/:id/photo', async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl, userName } = req.body;

    const task = await findTaskById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    task.photoUrl = photoUrl;
    task.lastPhotoUrl = photoUrl;
    task.attachedByName = userName || 'Partner';
    task.completedAt = task.completedAt || now;
    task.completedByName = task.completedByName || userName || 'Partner';
    task.date = todayStr;

    if (!task.history) task.history = [];
    task.history.push({
      date: todayStr,
      photoUrl,
      completedByName: userName || 'Partner',
      completedAt: now,
    });

    await task.save();

    return res.json({
      success: true,
      task: task.toJSON(),
    });
  } catch (error) {
    console.error('attach photo error:', error);
    return res.status(500).json({ success: false, error: 'Failed to attach photo' });
  }
});

/**
 * @route PUT /api/tasks/:id/toggle
 * @desc Toggle task completion for today
 */
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { userName } = req.body;

    const task = await findTaskById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? now : null;
    task.completedByName = task.isCompleted ? (userName || 'You') : null;
    task.date = todayStr;
    if (task.isCompleted) {
      task.streakCount = (task.streakCount || 0) + 1;
    }

    await task.save();

    return res.json({
      success: true,
      task: task.toJSON(),
    });
  } catch (error) {
    console.error('toggle task error:', error);
    return res.status(500).json({ success: false, error: 'Failed to toggle task' });
  }
});

/**
 * @route POST /api/tasks/:id/nudge
 * @desc Nudge partner about task
 */
router.post('/:id/nudge', async (req, res) => {
  try {
    const { id } = req.params;
    const { senderName, partnerName } = req.body;

    const task = await findTaskById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    task.lastNudgedAt = new Date();
    await task.save();

    console.log(`\n🔔 [Love Bites Nudge Alert] ${senderName} nudged ${partnerName} for task: "${task.title}" at ${task.time}!`);

    return res.json({
      success: true,
      message: `Nudge delivered to ${partnerName} for "${task.title}"!`,
      task: task.toJSON(),
    });
  } catch (error) {
    console.error('nudge task error:', error);
    return res.status(500).json({ success: false, error: 'Failed to nudge task' });
  }
});

/**
 * @route DELETE /api/tasks/:id
 * @desc Delete recurring task permanently
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Task.findByIdAndDelete(id);
    } else {
      await Task.deleteOne({ _id: id });
    }
    return res.json({ success: true, message: 'Task deleted permanently' });
  } catch (error) {
    console.error('delete task error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

module.exports = router;
