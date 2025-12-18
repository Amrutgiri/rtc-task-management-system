const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /roles - List all roles
router.get('/', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 });
        res.json(roles);
    } catch (err) {
        next(err);
    }
});

// POST /roles - Create new role
router.post('/', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { name, displayName, description, permissions } = req.body;

        // Check if role already exists
        const existing = await Role.findOne({ name: name.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'Role already exists' });
        }

        const role = await Role.create({
            name: name.toLowerCase(),
            displayName,
            description,
            permissions: permissions || [],
            isSystem: false
        });

        res.status(201).json(role);
    } catch (err) {
        next(err);
    }
});

// PUT /roles/:id - Update role
router.put('/:id', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        if (role.isSystem) {
            return res.status(403).json({ message: 'Cannot modify system role' });
        }

        const { displayName, description, permissions, isActive } = req.body;

        if (displayName) role.displayName = displayName;
        if (description !== undefined) role.description = description;
        if (permissions) role.permissions = permissions;
        if (isActive !== undefined) role.isActive = isActive;

        await role.save();
        res.json(role);
    } catch (err) {
        next(err);
    }
});

// DELETE /roles/:id - Delete role
router.delete('/:id', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        if (role.isSystem) {
            return res.status(403).json({ message: 'Cannot delete system role' });
        }

        // Check if any users have this role
        const usersWithRole = await User.countDocuments({ roleId: role._id });
        if (usersWithRole > 0) {
            return res.status(400).json({
                message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.`
            });
        }

        await Role.deleteOne({ _id: role._id });
        res.json({ message: 'Role deleted successfully' });
    } catch (err) {
        next(err);
    }
});

// POST /roles/assign - Assign role to user
router.post('/assign', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { userId, roleId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const role = await Role.findById(roleId);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        user.roleId = roleId;
        user.role = role.name; // Also update the role field for backward compatibility
        await user.save();

        res.json({ message: 'Role assigned successfully', user });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
