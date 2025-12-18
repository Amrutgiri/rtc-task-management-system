const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Notification = require("./models/Notification");
const NotificationSettings = require("./models/NotificationSettings");

let io = null;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // JOIN USER ROOM
    socket.on("join", (token) => {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.id || payload.sub || payload.user?.id;

        if (userId) {
          socket.join(`user_${userId}`);
          console.log(`User ${userId} joined room user_${userId}`);
        }
      } catch (err) {
        console.log("Invalid socket token");
      }
    });

    socket.on("auth", (token) => {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.id || payload._id || payload.userId;
        if (userId) {
          socket.join(`user_${userId}`);
          console.log(`User ${userId} authenticated via socket`);
        }
      } catch (e) {
        console.log("Socket auth failed", e.message);
      }
    });

    // JOIN TASK ROOM
    socket.on("join-task", (taskId) => {
      if (taskId) socket.join(`task_${taskId}`);
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  // --- HELPER FUNCTIONS ---

  /**
   * Send a notification to user + save to DB
   * Includes sound alert and push notification handling
   */
  io.sendNotificationToUser = async (userId, payload) => {
    try {
      // Check user's notification settings
      const settings = await NotificationSettings.findOne({ userId });

      // Check if user has muted this task/project
      if (settings) {
        if (payload.meta?.taskId && settings.mutedTasks.includes(payload.meta.taskId)) {
          console.log(`Task ${payload.meta.taskId} is muted for user ${userId}`);
          return;
        }

        if (payload.meta?.projectId && settings.mutedProjects.includes(payload.meta.projectId)) {
          console.log(`Project ${payload.meta.projectId} is muted for user ${userId}`);
          return;
        }

        // Check if notifications are globally disabled
        if (settings.frequency === 'never') {
          console.log(`User ${userId} has notifications disabled`);
          return;
        }

        // Check quiet hours
        if (settings.quietHours?.enabled) {
          const now = new Date();
          const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                             now.getMinutes().toString().padStart(2, '0');
          
          const start = settings.quietHours.startTime;
          const end = settings.quietHours.endTime;

          // Simple time range check (doesn't handle midnight crossing perfectly)
          if (start < end) {
            if (currentTime >= start && currentTime < end) {
              console.log(`User ${userId} is in quiet hours`);
              return;
            }
          }
        }
      }

      // Emit notification with sound and push flags
      const notificationPayload = {
        ...payload,
        playSound: settings?.soundAlerts !== false,
        sendPush: settings?.pushNotifications !== false,
      };

      io.to(`user_${userId}`).emit("notification", notificationPayload);

      // Save to database
      const notif = await Notification.create({
        userId,
        title: payload.title,
        body: payload.body,
        meta: payload.meta || {},
      });

      console.log(`Notification sent to user ${userId}`);
      return notif;
    } catch (err) {
      console.error("Notification send error:", err);
    }
  };

  /**
   * Emit new comment to task room
   */
  io.sendNewComment = (taskId, comment) => {
    io.to(`task_${taskId}`).emit("new-comment", comment);
  };

  /**
   * Send notification to task room members
   */
  io.sendTaskUpdate = (taskId, updateData) => {
    io.to(`task_${taskId}`).emit("task-updated", updateData);
  };

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initializeSocket, getIO };
