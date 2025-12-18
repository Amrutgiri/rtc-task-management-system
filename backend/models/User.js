const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    passwordHash: {
      type: String,
      required: false // admin may create user first then send "set password" link
    },

    role: {
      type: String,
      enum: ["user", "admin", "developer", "manager", "superadmin"],
      default: "user",
    },

    active: {
      type: Boolean,
      default: true,
    },

    avatar: {
      type: String,
      default: ""
    },

    image: { type: String, default: "" }, // Added image field

    // Activity Tracking
    lastLogin: { type: Date },
    lastActivity: { type: Date },
    isActive: { type: Boolean, default: true },

    // Role-Based Access Control
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },

    passwordChangedAt: {
      type: Date,
      default: null
    },

    resetPasswordToken: {
      type: String,
      default: null
    },

    resetPasswordExpires: {
      type: Date,
      default: null
    },

    verificationToken: {
      type: String,
      default: null
    },

    verificationTokenExpires: {
      type: Date,
      default: null
    },

    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

/* -------------------------------------------------------
   METHOD: Convert response to JSON (hide sensitive data)
------------------------------------------------------- */
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", UserSchema);
