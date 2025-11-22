import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./db.js";

import { authRouter } from "./Routers/auth.js";
import { campaignRouter } from "./Routers/campaigns.js";
import userRouter from "./Routers/users.js";
import donationRouter from "./Routers/donors.js";
import fundRaiserRouter from "./Routers/fundraisers.js";
import updateRouter from "./Routers/updates.js";
import adminRoutes from "./Routers/admin.js";

// ---------------- PATH FIX ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- INIT ----------------
const app = express();
const PORT = process.env.PORT || 3000;

// ---------------- CONNECT MONGODB ----------------
connectDB();   // <── IMPORTANT (connects to crowdfunding DB)

// ---------------- MIDDLEWARES ----------------
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:5173"],
    credentials: true,
    exposedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(helmet());

// ---------------- CSP POLICY ----------------
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' http://localhost:3000 http://127.0.0.1:3000 data:;"
  );
  next();
});

// ---------------- STATIC ASSETS ----------------
app.use(
  "/assets",
  express.static(path.join(__dirname, "assets"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// ---------------- ROUTES ----------------
app.use("/api/auth", authRouter);
app.use("/api", donationRouter);
app.use("/api/campaigns", campaignRouter);
app.use("/api/users", userRouter);
app.use("/api", fundRaiserRouter);
app.use("/api/updates", updateRouter);
app.use("/api/admin", adminRoutes); 

// ---------------- HOME ROUTE ----------------
app.get("/", (req, res) => {
  res.send("Server is alive!");
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});