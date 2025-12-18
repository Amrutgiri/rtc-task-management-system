# Environment Setup Instructions

## Frontend `.env` File (REQUIRED for local development)

Since `.env` files are in `.gitignore`, you need to create this file manually:

### Location
```
d:\03-My All Learning Work\04-MERN\TMS\frontend\.env
```

### Contents
```env
# Backend API URL - points to local backend
# Important: Include /api at the end
VITE_API_URL=http://localhost:3232/api
```

### Steps
1. Open File Explorer
2. Navigate to `d:\03-My All Learning Work\04-MERN\TMS\frontend\`
3. Create a new file named `.env` (note the dot at the beginning)
4. Copy the contents above into the file
5. Save the file

---

## Backend `.env` File (Verify CORS settings)

The backend `.env` file already exists. Please verify it contains:

### Location
```
d:\03-My All Learning Work\04-MERN\TMS\backend\.env
```

### Required Settings
```env
PORT=3232
FRONTEND_ORIGIN=http://localhost:5173
```

> **Note:** Vite's default dev server runs on port 5173. If your frontend runs on a different port, update `FRONTEND_ORIGIN` accordingly.

---

## After Creating/Updating .env Files

1. **Restart the backend server** if it's running
2. **Restart the frontend dev server** if it's running
3. The Socket.IO connection should now work without CORS errors
