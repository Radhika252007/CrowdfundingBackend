import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";

dotenv.config();

export const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No access token provided" });
    }

    const token = authHeader.split(" ")[1]; // extract token from "Bearer xxx"

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);

    const admin = await Admin.findOne({ admin_id: decoded.admin_id });
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};
