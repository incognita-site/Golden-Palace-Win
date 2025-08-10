import express from "express";
import cors from "cors";
import { createRoutes } from "./routes";
import { MemStorage } from "./storage";
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize storage
const storage = new MemStorage();

// API routes
app.use("/api", createRoutes(storage));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎰 Golden Palace Casino server running on port ${PORT}`);
});