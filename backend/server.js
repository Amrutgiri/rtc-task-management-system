require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { initializeSocket } = require("./socket");
const connect = require("./utils/db");
const errorHandler = require("./middleware/errorHandler");

// ROUTES
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const projectsRoutes = require("./routes/projects");
const tasksRoutes = require("./routes/tasks");
const commentsRoutes = require("./routes/comments");
const notificationsRoutes = require("./routes/notifications");
const notificationSettingsRoutes = require("./routes/notificationSettings");
const importRoutes = require("./routes/import");

const app = express();
const server = http.createServer(app);

// --- INIT SOCKET.IO ---
const io = initializeSocket(server);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "*",
    credentials: true,
  })
);

// --- ROUTES ---
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/projects", projectsRoutes);
app.use("/tasks", tasksRoutes);
app.use("/comments", commentsRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/notification-settings", notificationSettingsRoutes);
app.use("/worklogs", require("./routes/worklogs"));
app.use("/analytics", require("./routes/analytics"));
app.use("/audit", require("./routes/audit"));
app.use("/roles", require("./routes/roles"));
app.use("/health", require("./routes/health"));
app.use("/system-settings", require("./routes/systemSettings"));
app.use("/dashboard", require("./routes/dashboard"));
app.use("/import", importRoutes); // Bulk import routes

// HEALTH CHECK
app.get("/", (req, res) => res.json({ ok: true }));

// GLOBAL ERROR HANDLER
app.use(errorHandler);

const PORT = process.env.PORT || 3232;

// --- CONNECT DB + START SERVER ---
connect()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connect error:", err);
  });

module.exports = { app, io };
