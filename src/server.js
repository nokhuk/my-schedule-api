require("dotenv").config();
const express = require("express");
const cors = require("cors");
const eventRoutes = require("./routes/events");
const { startReminderCron } = require("./services/reminder");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- Routes ----------
app.get("/", (_req, res) => {
  res.json({
    message: "Life Scheduler API is running",
    version: "1.0.0",
    endpoints: {
      events: "/events",
    },
  });
});

app.use("/events", eventRoutes);

// ---------- Global error handler ----------
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  startReminderCron();
});
