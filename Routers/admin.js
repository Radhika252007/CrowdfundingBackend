import express from "express";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import CampaignImage from "../models/CampaignImage.js";
import CampaignFile from "../models/CampaignFile.js";
import { adminAuth } from "../middleware/adminAuth.js";
import Category from '../models/Category.js';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const router = express.Router();

// --- Admin Login ---
router.post("/login", async (req, res) => {
  try {
    const { admin_email, admin_pass } = req.body;
    console.log("Login attempt:", req.body);

    const admin = await Admin.findOne({ admin_email: admin_email });
console.log("Admin found in DB:", admin);

if (!admin) return res.status(401).json({ message: "Invalid email or password" });

const isMatch = await bcrypt.compare(admin_pass, admin.admin_pass);
console.log(isMatch)
if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });


    const token = jwt.sign({ admin_id: admin.admin_id }, process.env.ACCESS_SECRET_KEY, { expiresIn: "1d" });

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// REGISTER NEW ADMIN (Backend generates admin_id)
router.post("/register", async (req, res) => {
    console.log("Register body:", req.body);
  try {
    const { admin_name, admin_email, admin_pass } = req.body;

    if (!admin_name || !admin_email || !admin_pass) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingAdmin = await Admin.findOne({ admin_email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPass = await bcrypt.hash(admin_pass, 10);

    const newAdmin = await Admin.create({
      admin_id: await generateAdminId(),
      admin_name,
      admin_email,
      admin_pass: hashedPass,
    });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        admin_id: newAdmin.admin_id,
        admin_name: newAdmin.admin_name,
        admin_email: newAdmin.admin_email,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// --- Protected Routes ---
router.use(adminAuth);

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all campaigns
// Get all campaigns
router.get("/campaigns", async (req, res) => {
  try {
    const { status, category } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (category) filter.category_id = category;

    let campaigns = await Campaign.find(filter)
      .populate("user_id", "name email")      // Owner
      .lean();

    for (let campaign of campaigns) {

      // ⭐ Fetch Category Name instead of ID
      if (campaign.category_id) {
        const cat = await Category.findOne({ category_id: campaign.category_id });
        campaign.category_name = cat ? cat.name : "Unknown";
      }

      // ⭐ Fetch total raised amount
      const donations = await Donation.find({ campaign_id: campaign.campaign_id });
      campaign.raisedAmount = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

      // existing image + file fetch
      campaign.images = await CampaignImage.find({ campaign_id: campaign.campaign_id });
      campaign.files = await CampaignFile.find({ campaign_id: campaign.campaign_id });
    }
    console.log(campaigns);
    res.json(campaigns);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});
router.get("/mycampaigns", async (req, res) => {
  console.log("Admin ID from token:", req.admin.admin_id);

  try {
    const { status, category } = req.query;

    let filter = { admin_id: req.admin.admin_id };

    if (status) filter.status = status;
    if (category) filter.category_id = category;

    let campaigns = await Campaign.find(filter)
      .populate("user_id", "name email")
      .lean();

    for (let campaign of campaigns) {
      if (campaign.category_id) {
        const cat = await Category.findOne({ category_id: campaign.category_id });
        campaign.category_name = cat ? cat.name : "Unknown";
      }

      const donations = await Donation.find({ campaign_id: campaign.campaign_id });
      campaign.raisedAmount = donations.reduce(
        (sum, d) => sum + Number(d.amount || 0),
        0
      );

      campaign.images = await CampaignImage.find({ campaign_id: campaign.campaign_id });
      campaign.files = await CampaignFile.find({ campaign_id: campaign.campaign_id });
    }

    res.json(campaigns);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// Approve a campaign
router.patch("/campaign/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findOneAndUpdate(
      { campaign_id: id },
      { status: "Approved" },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all donations
router.get("/donations", async (req, res) => {
  try {
    const donations = await Donation.find({}).populate("user_id", "name email").lean();
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
async function generateAdminId() {
  const count = await Admin.countDocuments(); // count existing admins
  const nextId = count + 1; // next number
  return "ADM" + String(nextId).padStart(3, "0"); // ADM001, ADM002, .
}

export default router;
