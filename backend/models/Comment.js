const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    content: { type: String, required: true },

    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },

    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    attachments: [
      {
        url: String,
        fileName: String,
        publicId: String, // Cloudinary ID (for deletion later)
      },
    ],

    // NEW: reactions
    reactions: {
      like: [{ type: Schema.Types.ObjectId, ref: "User" }],
      dislike: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },

    deleted: {
      type: Boolean,
      default: false, // soft delete support
    },
  },
  { timestamps: true }
);

// Hide internal fields
CommentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("Comment", CommentSchema);
