const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AttachmentSchema = new Schema(
  {
    filename: { type: String, required: true },      // Original filename
    path: { type: String, required: true },          // Server file path
    url: { type: String },                           // Public URL (if using cloud storage)
    mimetype: { type: String, required: true },      // File MIME type
    size: { type: Number, required: true },          // File size in bytes
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const TaskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },

    description: { type: String, default: "" },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
      index: true,
    },

    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required: true, // Removed to support legacy tasks
      index: true,
    },

    status: {
      type: String,
      enum: ["open", "in-progress", "review", "completed"],
      default: "open",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    taskDate: {
      type: Date,
      required: true,
      index: true,
      default: () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },

    dueDate: { type: Date },

    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// --------- Indexes (Clean + No duplicates) ----------
TaskSchema.index({ taskDate: 1 });
TaskSchema.index({ projectId: 1, taskDate: 1 });
TaskSchema.index({ assigneeId: 1, taskDate: 1 });
TaskSchema.index({ projectId: 1, status: 1 });

// Faster filtering by date & user
TaskSchema.index({ assigneeId: 1, status: 1 });

//------------------------------------------------------

module.exports = mongoose.model("Task", TaskSchema);
