const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // NEW: Who triggered it
  title: { type: String, required: true },
  body: { type: String },
  meta: { type: Schema.Types.Mixed },
  read: { type: Boolean, default: false },
}, { timestamps: true });

/* ----------------------------------------------------
   STATIC: Creates + emits notification automatically
---------------------------------------------------- */
NotificationSchema.statics.send = async function (userId, data) {
  const Notification = this;
  const { getIO } = require("../socket");

  const notif = await Notification.create({
    userId,
    senderId: data.senderId || null,
    title: data.title,
    body: data.body,
    meta: data.meta || {},
  });

  // Populate sender info before emitting
  await notif.populate('senderId', 'name avatar');

  const io = getIO();
  io.to(`user_${userId}`).emit("notification", notif);

  return notif;
};

module.exports = mongoose.model('Notification', NotificationSchema);
