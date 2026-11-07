
import express from "express";
import dns from "node:dns";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import goalRoutes from "./routes/goalroutes.js";
import projectRoutes from "./routes/projectroutes.js";
import noteRoutes from "./routes/noteroutes.js";

dotenv.config();

const configuredDnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(",")
  .map(server => server.trim())
  .filter(Boolean);

if (configuredDnsServers?.length) {
  dns.setServers(configuredDnsServers);
} else if (dns.getServers().every(server => ["127.0.0.1", "::1", "[::1]"].includes(server))) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/goals", goalRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notes", noteRoutes);

app.get("/", (req, res) => {
  res.send("StudyFlow Backend is Running!");
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status === 400 ? 400 : 500;
  console.error("API request failed:", error.message);
  res.status(status).json({
    message: status === 400 ? "Invalid request body." : "An unexpected server error occurred.",
  });
});

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully.");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`StudyFlow API listening on port ${PORT}`);
    });

  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();