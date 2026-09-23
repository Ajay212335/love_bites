const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');

/**
 * @route GET /api/tasks
 * @desc Get all tasks for user and their linked partner
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId query parameter is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Query tasks created by user OR their partner
    const creatorIds = [user._id];
    if (user.partnerId) {
      creatorIds.push(user.partnerId);
    }

    const tasks = await Task.find({ creatorId: { $in: creatorIds } }).sort({ hour: 1, minute: 1 });

    return res.json({
      success: true,
      tasks: tasks.map((t) => t.toJSON()),
    });
  } catch (error) {
    console.error('get tasks error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

/**
 * @route POST /api/tasks
 * @desc Create new daily task
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
      photoUrl,
      attachedByName,
      date,
    } = req.body;

    if (!title || !time || hour === undefined || minute === undefined || !creatorId) {
      return res.status(400).json({ success: false, error: 'Missing required task fields' });
    }

    const user = await User.findById(creatorId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const todayDate = date || new Date().toISOString().split('T')[0];

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      time,
      hour,
      minute,
      category: category || 'romance',
      assignedTo: assignedTo || 'both',
      creatorId: user._id,
      creatorName: user.name,
      photoUrl: photoUrl || null,
      attachedByName: attachedByName || null,
      date: todayDate,
      streakCount: 1,
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
 * @route PUT /api/tasks/:id/complete-with-photo
 * @desc Complete task with attached photo proof in DB
 */
router.put('/:id/complete-with-photo', async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl, userName } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const now = new Date();
    task.isCompleted = true;
    task.photoUrl = photoUrl || task.photoUrl;
    task.attachedByName = userName || 'Partner';
    task.completedAt = now;
    task.completedByName = userName || 'Partner';
    task.streakCount = (task.streakCount || 0) + 1;

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

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    task.photoUrl = photoUrl;
    task.attachedByName = userName || 'Partner';
    task.completedAt = task.completedAt || new Date();
    task.completedByName = task.completedByName || userName || 'Partner';
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
 * @desc Toggle task completion
 */
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { userName } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;
    task.completedByName = task.isCompleted ? (userName || 'You') : null;
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

    const task = await Task.findById(id);
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
 * @desc Delete task
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Task.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('delete task error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

module.exports = router;
