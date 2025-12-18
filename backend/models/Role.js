const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    displayName: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ''
    },

    permissions: [{
        resource: {
            type: String,
            required: true,
            enum: ['tasks', 'projects', 'users', 'worklogs', 'reports', 'settings', 'audit']
        },
        actions: [{
            type: String,
            enum: ['create', 'read', 'update', 'delete', 'manage']
        }]
    }],

    isSystem: {
        type: Boolean,
        default: false // System roles (admin, user) cannot be deleted
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Prevent deletion of system roles
RoleSchema.pre('deleteOne', function (next) {
    if (this.isSystem) {
        return next(new Error('Cannot delete system role'));
    }
    next();
});

module.exports = mongoose.model('Role', RoleSchema);
