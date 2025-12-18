const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WorkLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  date: { type: Date, required: true }, // the day the work belongs to
  timeStarted: { type: Date },
  timeEnded: { type: Date },
  durationMinutes: { type: Number },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('WorkLog', WorkLogSchema);
