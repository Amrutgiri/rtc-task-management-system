# 🔐 BOOTSTRAP FIRST ADMIN USER

## Problem
You need an admin user to access the admin panel, but the database is empty.

## Solutions

### **SOLUTION 1: MongoDB Direct Insertion (FASTEST - 2 minutes) ⭐**

Use MongoDB Compass or mongosh CLI to directly insert an admin user.

#### **Option A: Using MongoDB Compass (GUI)**
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to: `tms` → `users` collection
4. Click "Insert Document"
5. Paste this JSON:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "passwordHash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ED3TSm",
  "role": "admin",
  "active": true,
  "avatar": "",
  "passwordChangedAt": null,
  "createdAt": new Date(),
  "updatedAt": new Date()
}
```

**The password for this user is**: `password123`

6. Click "Insert"
7. Done! ✅

---

#### **Option B: Using mongosh CLI**

```bash
# Connect to your MongoDB
mongosh

# Select database
use tms

# Insert admin user
db.users.insertOne({
  "name": "Admin User",
  "email": "admin@example.com",
  "passwordHash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ED3TSm",
  "role": "admin",
  "active": true,
  "avatar": "",
  "passwordChangedAt": null,
  "createdAt": new Date(),
  "updatedAt": new Date()
})

# Verify it was created
db.users.findOne({ email: "admin@example.com" })

# Exit
exit
```

---

### **SOLUTION 2: Using a Seed Script (CLEAN - 5 minutes)**

Create a file: `backend/scripts/seedAdmin.js`

```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const adminUser = {
  name: "Admin User",
  email: "admin@example.com",
  passwordHash: await bcrypt.hash("admin@123", 10),
  role: "admin",
  active: true
};

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const exists = await User.findOne({ email: adminUser.email });
    if (exists) {
      console.log("❌ Admin user already exists");
      process.exit(1);
    }
    
    const user = await User.create(adminUser);
    console.log("✅ Admin user created:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: admin@123`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedAdmin();
```

**Run it**:
```bash
cd backend
node scripts/seedAdmin.js
```

---

### **SOLUTION 3: Temporary Bootstrap Endpoint (FLEXIBLE - 10 minutes)**

Add this to `backend/routes/auth.js` temporarily:

```javascript
// TEMPORARY: Remove after first admin created
router.post('/bootstrap', async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    
    // Only allow if database is empty
    if (userCount > 0) {
      return res.status(403).json({ message: 'Database not empty' });
    }

    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("admin@123", 10),
      role: "admin",
      active: true
    });

    res.json({ 
      message: "Admin user created",
      email: admin.email,
      password: "admin@123"
    });
  } catch (err) {
    next(err);
  }
});
```

**Use it**:
```bash
curl -X POST http://localhost:5000/api/auth/bootstrap
```

**Then remove the endpoint** when done.

---

## 🔑 TEST CREDENTIALS

Use these to login:

### **Admin User**
```
Email: admin@example.com
Password: password123
```

### **Create More Test Users** (After logging in as admin)

1. Go to `/admin/users`
2. Click "➕ New User"
3. Create with names:
   - **manager@example.com** → Manager role
   - **dev1@example.com** → Developer role
   - **dev2@example.com** → Developer role

Then each user can login with their email and set their own password.

---

## ⚡ QUICKEST METHOD (RECOMMENDED)

**Use Solution 1, Option A**:
1. Open MongoDB Compass
2. Paste JSON above
3. Insert document
4. Done in 2 minutes
5. Login immediately

Then test in this order:
1. Login as admin
2. Go to `/admin/users`
3. Create test users
4. Deactivate/reactivate
5. Reset passwords
6. Everything works! ✅

---

## 🚀 STEP-BY-STEP QUICK START

### Step 1: Create Admin User (Choose one method above)
Recommended: **MongoDB Compass** (2 min)

### Step 2: Login
```
URL: http://localhost:5173/login
Email: admin@example.com
Password: password123
```

### Step 3: Access Admin Panel
```
After login:
Sidebar → Admin Panel → Users
Or directly: http://localhost:5173/admin/users
```

### Step 4: Create Test Users
```
Click "➕ New User"
Create 3-5 test users with different roles
```

### Step 5: Test Features
```
✅ Search users
✅ Filter by role
✅ Edit user
✅ Reset password
✅ Deactivate/activate
```

---

## ⚠️ Important Notes

- **Password Hash**: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ED3TSm` is bcrypt hash of `password123`
- **JWT Secret**: Make sure your `MONGODB_URI` and `JWT_SECRET` are in `.env`
- **Email Unique**: Email must be unique, so use different emails for test users
- **Active Flag**: New users have `active: true` by default

---

## 🧪 Verify It Works

### After creating admin user, test with curl:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

You should get back:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

---

## ❌ Troubleshooting

### "Invalid credentials" error
- Check password is exactly: `password123`
- Check email is: `admin@example.com`
- Check `passwordHash` was inserted correctly

### "No password set" error
- Make sure `passwordHash` field is filled (not null/empty)
- Use the exact hash provided above

### Admin panel still doesn't show
- Make sure role is exactly: `"admin"` (not "Admin")
- Clear browser cache
- Logout and login again

---

## 📝 Custom Passwords

If you want different password, use this to generate hash:

**Online tool**: https://bcrypt-generator.com/
- Password: `your_password_here`
- Cost: 10
- Copy the hash

Or use Node.js:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('your_password_here', 10).then(hash => console.log(hash));
```

---

## 🎯 NEXT STEPS

1. **✅ Create admin user** (using one method above)
2. **Login** with admin@example.com / password123
3. **Create test users** using admin panel
4. **Test all features** (search, filter, edit, reset, deactivate)
5. **Explore admin panel** - Try creating/editing/deleting users

---

**Ready? Let me know which method you want to use and I'll help!**
