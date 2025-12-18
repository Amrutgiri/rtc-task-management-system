# 🚀 Quick Admin Setup - 30 Seconds

## One-Command Setup

```bash
cd backend
npm run seed:admin
```

**Done!** Your admin user is ready:
- Email: `admin@example.com`
- Password: `admin@123`

---

## Custom Setup

```bash
npm run seed:admin -- --email your-email@example.com --password yourPassword123
```

---

## Reset Existing Admin Password

```bash
npm run seed:admin
# When prompted "Do you want to reset the password?" → type: yes
```

---

## Next Steps

1. ✅ Run seeder
2. 🌐 Go to frontend (usually http://localhost:5173)
3. 🔐 Click **Login**
4. 📧 Enter email from seeder
5. 🔑 Enter password from seeder
6. 📊 Access **Admin Dashboard** from sidebar

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module" | Run `npm install` first |
| MongoDB connection error | Start MongoDB, check `.env` MONGODB_URI |
| Admin already exists | Seeder will ask to reset password |

---

For detailed guide, see [SEEDING_GUIDE.md](SEEDING_GUIDE.md)
