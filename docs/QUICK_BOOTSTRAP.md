# 🚀 FASTEST WAY TO CREATE FIRST ADMIN (2 MINUTES)

## **Method: MongoDB Compass GUI**

### Step 1: Open MongoDB Compass
```
1. Open MongoDB Compass application
2. Click "Connect" (should auto-connect to local MongoDB)
3. You see database list on left
```

### Step 2: Navigate to Users Collection
```
Database List (Left)
  ↓
Click "tms" database
  ↓
Click "users" collection
  ↓
You see the collection (currently empty)
```

### Step 3: Insert Admin User
```
Top Right → Click "ADD DATA" button
  ↓
Choose "Insert Document"
  ↓
Paste this JSON exactly:
```

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "passwordHash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ED3TSm",
  "role": "admin",
  "active": true,
  "avatar": "",
  "passwordChangedAt": null,
  "createdAt": {"$date": "2025-12-15T00:00:00Z"},
  "updatedAt": {"$date": "2025-12-15T00:00:00Z"}
}
```

### Step 4: Insert
```
Bottom Right → Click "Insert" button
  ↓
✅ Document inserted successfully
```

### Step 5: Verify
```
You should see new document in the list
Check email field shows: admin@example.com
Check role field shows: admin
```

---

## 🔐 Login Credentials (After inserting)

```
EMAIL:    admin@example.com
PASSWORD: password123
```

---

## ✅ Test Login

### Method 1: Web App
```
1. Go to: http://localhost:5173/login
2. Enter: admin@example.com
3. Enter: password123
4. Click Login
5. You should see Dashboard ✅
```

### Method 2: Command Line (curl)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

Response should include:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "role": "admin"
  }
}
```

---

## 📊 Verify in Admin Panel

After login:

```
1. Go to: http://localhost:5173/admin/users
2. Click "➕ New User"
3. Create a test user:
   Name: John Developer
   Email: john@example.com
   Role: Developer
   Click "Create User"
4. New user appears in list ✅
```

---

## 🎯 That's It! You're Done

Now you have:
- ✅ Admin user created
- ✅ Can login as admin
- ✅ Can access admin panel
- ✅ Can create/edit/delete users
- ✅ Can manage entire system

**Total time: ~2 minutes**

---

## If MongoDB Compass Not Installed

### Alternative: Use mongosh CLI

```bash
# Open terminal/PowerShell

# Connect to MongoDB
mongosh

# Select your database
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

# Should see:
# { acknowledged: true, insertedId: ObjectId("...") }

# Exit
exit
```

Then login with:
- Email: `admin@example.com`
- Password: `password123`

---

## ✨ Password Explained

The hash `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36ED3TSm` is bcrypt hash of password `password123`.

You can use this same password for all test accounts initially.

Later, each user can reset their own password via admin panel.

---

**Choose your method and let me know if you need help!**
