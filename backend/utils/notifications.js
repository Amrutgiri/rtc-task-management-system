/**
 * Notification Helper Functions
 * 
 * Use these helpers to send notifications from anywhere in your backend
 * when events happen (task assigned, comment added, status changed, etc.)
 */

const { getIO } = require('./socket');
const Notification = require('./models/Notification');

/**
 * Send task assignment notification
 */
async function notifyTaskAssignment(assigneeId, taskId, taskTitle, assignedByName) {
  try {
    const io = getIO();
    await io.sendNotificationToUser(assigneeId, {
      title: 'New Task Assigned',
      body: `"${taskTitle}" has been assigned to you by ${assignedByName}`,
      meta: {
        taskId: taskId,
        type: 'taskAssigned',
      },
      playSoundAlert: true,
    });
  } catch (err) {
    console.error('Error notifying task assignment:', err);
  }
}

/**
 * Send task status change notification
 */
async function notifyTaskStatusChange(taskId, taskTitle, newStatus, changedByName, assigneeId) {
  try {
    const io = getIO();
    await io.sendNotificationToUser(assigneeId, {
      title: 'Task Status Changed',
      body: `"${taskTitle}" status changed to ${newStatus} by ${changedByName}`,
      meta: {
        taskId: taskId,
        type: 'taskStatusChanged',
      },
      playSoundAlert: true,
    });
  } catch (err) {
    console.error('Error notifying task status change:', err);
  }
}

/**
 * Send new comment notification
 */
async function notifyNewComment(taskId, taskTitle, commentAuthorName, commentPreview, targetUserId) {
  try {
    const io = getIO();
    await io.sendNotificationToUser(targetUserId, {
      title: `${commentAuthorName} commented on "${taskTitle}"`,
      body: commentPreview,
      meta: {
        taskId: taskId,
        type: 'taskCommented',
      },
      playSoundAlert: true,
    });
  } catch (err) {
    console.error('Error notifying new comment:', err);
  }
}

/**
 * Send mention notification
 */
async function notifyMention(taskId, taskTitle, mentionedByName, mentionContext, mentionedUserId) {
  try {
    const io = getIO();
    await io.sendNotificationToUser(mentionedUserId, {
      title: `You were mentioned by ${mentionedByName}`,
      body: mentionContext,
      meta: {
        taskId: taskId,
        type: 'mentionedInComment',
      },
      playSoundAlert: true,
    });
  } catch (err) {
    console.error('Error notifying mention:', err);
  }
}

/**
 * Send project update notification
 */
async function notifyProjectUpdate(projectId, projectName, updateDescription, targetUserIds = []) {
  try {
    const io = getIO();
    
    // Send to multiple users if provided, otherwise just create notification
    for (const userId of targetUserIds) {
      await io.sendNotificationToUser(userId, {
        title: `Project "${projectName}" Updated`,
        body: updateDescription,
        meta: {
          projectId: projectId,
          type: 'projectUpdated',
        },
        playSoundAlert: false, // Less intrusive
      });
    }
  } catch (err) {
    console.error('Error notifying project update:', err);
  }
}

/**
 * Send generic notification to single user
 */
async function sendNotificationToUser(userId, title, body, meta = {}, playSoundAlert = true) {
  try {
    const io = getIO();
    await io.sendNotificationToUser(userId, {
      title,
      body,
      meta,
      playSoundAlert,
    });
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}

/**
 * Send bulk notification to multiple users
 */
async function sendNotificationToUsers(userIds, title, body, meta = {}, playSoundAlert = false) {
  try {
    const io = getIO();
    
    for (const userId of userIds) {
      await io.sendNotificationToUser(userId, {
        title,
        body,
        meta,
        playSoundAlert,
      });
    }
  } catch (err) {
    console.error('Error sending bulk notification:', err);
  }
}

module.exports = {
  notifyTaskAssignment,
  notifyTaskStatusChange,
  notifyNewComment,
  notifyMention,
  notifyProjectUpdate,
  sendNotificationToUser,
  sendNotificationToUsers,
};

/**
 * USAGE EXAMPLES
 * 
 * In tasks.js or comments.js routes:
 * 
 * const { notifyTaskAssignment, notifyNewComment } = require('../utils/notifications');
 * 
 * // When assigning task
 * router.patch('/:id', async (req, res) => {
 *   const { assigneeId } = req.body;
 *   const task = await Task.findById(req.params.id);
 *   
 *   task.assigneeId = assigneeId;
 *   await task.save();
 *   
 *   // Send notification
 *   await notifyTaskAssignment(
 *     assigneeId,
 *     task._id,
 *     task.title,
 *     req.user.name
 *   );
 *   
 *   res.json(task);
 * });
 * 
 * // When adding comment
 * router.post('/', async (req, res) => {
 *   const comment = await Comment.create({
 *     taskId: req.body.taskId,
 *     userId: req.user.id,
 *     content: req.body.content
 *   });
 *   
 *   const task = await Task.findById(comment.taskId).populate('assigneeId');
 *   
 *   // Notify task assignee if different from comment author
 *   if (task.assigneeId._id.toString() !== req.user.id) {
 *     await notifyNewComment(
 *       task._id,
 *       task.title,
 *       req.user.name,
 *       req.body.content.substring(0, 100),
 *       task.assigneeId._id
 *     );
 *   }
 *   
 *   res.json(comment);
 * });
 */
