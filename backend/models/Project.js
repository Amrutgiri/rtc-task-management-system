const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Attachment schema for file uploads
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

const ProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },

    description: { type: String, default: "" },

    key: {
      type: String,
      uppercase: true,
      trim: true,
      unique: true,
      sparse: true, // allow multiple null keys
    },

    // Admin who created/owns this project
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project owner (admin) is required"],
      index: true,
      validate: {
        validator: function (v) {
          return v !== null && v !== undefined;
        },
        message: "Project owner (admin) is required"
      }
    },

    // Team members allowed to work on the project
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Active means project is running / Archived means completed or paused
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },

    // Auto-updated count of tasks inside project
    taskCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // File attachments
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// ------------------------------------------------------------
// INDEXES
// ------------------------------------------------------------
ProjectSchema.index({ name: 1 });
ProjectSchema.index({ key: 1 });
ProjectSchema.index({ ownerId: 1 });
ProjectSchema.index({ status: 1 });

// ------------------------------------------------------------
// STATIC REFERENCE FOR TASK COUNT UPDATING
// ------------------------------------------------------------
ProjectSchema.statics.incrementTaskCount = async function (projectId) {
  return this.findByIdAndUpdate(projectId, { $inc: { taskCount: 1 } });
};

ProjectSchema.statics.decrementTaskCount = async function (projectId) {
  return this.findByIdAndUpdate(projectId, { $inc: { taskCount: -1 } });
};

module.exports = mongoose.model("Project", ProjectSchema);
