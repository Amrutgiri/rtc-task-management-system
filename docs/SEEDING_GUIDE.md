# Database Seeding Guide

This guide explains how to set up initial data in your TMS application using seeders.

## Admin User Seeder

### Purpose
Creates an initial admin user account to access the admin panel and manage the application.

### Prerequisites
- MongoDB running and accessible
- Backend `.env` file configured with `MONGODB_URI`
- Node.js dependencies installed (`npm install`)

### Usage

#### Basic Usage (Default Credentials)
```bash
cd backend
npm run seed:admin
```

This will create an admin user with:
- **Email**: `admin@example.com`
- **Password**: `admin@123`
- **Name**: `Admin User`
- **Role**: `admin`

#### Custom Credentials
```bash
npm run seed:admin -- --email your-email@example.com --password yourPassword123 --name "Your Name"
```

**Arguments:**
- `--email`: Email address for the admin user (default: `admin@example.com`)
- `--password`: Password for the admin user (default: `admin@123`)
- `--name`: Full name of the admin user (default: `Admin User`)

### Examples

**Create admin with custom email:**
```bash
npm run seed:admin -- --email apgoswami@example.com --password SecurePass123
```

**Create admin with all custom details:**
```bash
npm run seed:admin -- --email admin@company.com --password MyP@ssw0rd --name "John Admin"
```

### What the Seeder Does

1. Connects to MongoDB using `MONGODB_URI` from `.env`
2. Checks if admin user already exists
3. If exists:
   - Asks if you want to reset the password
   - Updates password if you confirm
4. If new:
   - Hashes the password using bcrypt (10 salt rounds)
   - Creates admin user in MongoDB
   - Sets `role` to `admin` and `active` to `true`
5. Displays login credentials for verification
6. Closes database connection

### Login to Admin Panel

1. Go to your frontend application
2. Click **Login**
3. Enter the email and password created by the seeder
4. You'll be redirected to the **Admin Dashboard**
5. Access **Admin Panel** from the sidebar to manage users, projects, analytics, etc.

### Post-Setup Recommendations

After initial setup, consider changing the default admin password:

1. Login to the admin panel
2. Go to **Profile/Settings** (if available)
3. Change your password to something secure
4. Share only with trusted team members

### Troubleshooting

**Error: "Cannot find module 'mongoose'"**
- Run: `npm install` in the backend directory

**Error: "MONGODB_URI not set"**
- Check your `.env` file has: `MONGODB_URI=mongodb://...`
- Restart the seeder after fixing `.env`

**Error: "connect ECONNREFUSED"**
- MongoDB is not running
- Start MongoDB service on your system

**Admin already exists but password doesn't work**
- Run seeder again and reset the password when prompted

### Automation in Development

To automatically seed the admin on every fresh project setup, you can:

1. Add to `.gitignore`: `.env.local` (development only)
2. In CI/CD pipelines, add before starting the server:
   ```bash
   npm run seed:admin -- --email ci-admin@example.com --password ci-password-123
   ```

### Security Notes

⚠️ **Important for Production:**
- Never commit real passwords to version control
- Use environment variables for credentials in production
- Change default admin password immediately after setup
- Use strong passwords (at least 12 characters with mixed case, numbers, symbols)
- Rotate admin credentials regularly
- Audit admin activities in logs

### Future Enhancements

Consider extending the seeding system for:
- Initial project templates
- Sample tasks and workflows
- Default notification settings
- Role-based permissions setup
- Demo data for testing

---

**Created**: During TMS project initialization
**Last Updated**: Current session
**Status**: Production Ready
