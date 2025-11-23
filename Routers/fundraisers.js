import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { authenticateUser } from "./auth.js";

// Mongo Models
import Campaign from "../models/Campaign.js";
import Category from "../models/Category.js";
import Beneficiary from "../models/Beneficiary.js";
import CampaignImage from "../models/CampaignImage.js";
import CampaignFile from "../models/CampaignFile.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";


const router = express.Router();

// ---------------- Multer Memory Storage ----------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------- Cloudinary Upload Helper ----------------
async function cloudinaryUpload(buffer, folder, resource_type = "image") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ---------------- Campaign Form Route ----------------
router.post(
  "/campaignform",
  authenticateUser,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "files", maxCount: 2 },
  ]),
  async (req, res) => {
    try {
      const campaign_id = await getNextCampaignId();
      const {
        title,
        category, 
        description,
        goal_amount,
        start_date,
        end_date,
        beneficiary_name,
        beneficiary_type,
        beneficiary_description,
        beneficiary_address,
      } = req.body;
      console.log(category)
      const user_id = req.user.id;

      const categoryDoc = await Category.findOne({ name: category });
      console.log(categoryDoc);
      if (!categoryDoc)
        return res.status(404).json({ message: "Category not found" });

      const category_id = categoryDoc.category_id;

      let beneficiary = await Beneficiary.findOne({
        beneficiary_name,
        address: beneficiary_address,
      });

      let beneficiary_id;
      if (!beneficiary) {
        beneficiary_id = await getNextBeneficiaryId();
        beneficiary = await Beneficiary.create({
          beneficiary_id,
          beneficiary_name,
          type: beneficiary_type,
          description: beneficiary_description,
          address: beneficiary_address,
        });
      } else {
        beneficiary_id = beneficiary.beneficiary_id;
      }

      const existing = await Campaign.findOne({
        title,
        beneficiary_id,
      });

      if (existing)
        return res
          .status(409)
          .json({ message: "Campaign already exists for this beneficiary" });

      const admin_id = await adminAssigned();
      const campaign = await Campaign.create({
        campaign_id,
        title,
        description,
        goal_amount,
        start_date,
        end_date,
        user_id,
        beneficiary_id,
        category_id, 
        admin_id,
        status: "Pending",
      });

      if (req.files.images) {
        for (let file of req.files.images) {
          const result = await cloudinaryUpload(file.buffer, "campaign/images");
          const image_id = await getNextImageId();

          await CampaignImage.create({
            image_id,
            campaign_id,
            image_path: result.secure_url,
          });
        }
      }

      if (req.files.files) {
        for (let file of req.files.files) {
          const result = await cloudinaryUpload(
            file.buffer,
            "campaign/files",
            "raw"
          );
          const file_id = await getNextFileId();

          await CampaignFile.create({
            file_id,
            campaign_id,
            file_path: result.secure_url,
          });
        }
      }

      const user = await User.findById(req.user.id);
if (user.user_role === "Donor") {
  await User.updateOne(
    { _id: req.user.id },
    { $set: { user_role: "Both" } }
  );
}


      return res.status(201).json({
        message: "Campaign created successfully",
        campaign_id,
        admin_id,
      });
    } catch (err) {
      console.error("ERROR:", err);
      return res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
      });
    }
  }
);

async function getNextBeneficiaryId() {
  const last = await Beneficiary.findOne().sort({ beneficiary_id: -1 });
  if (!last) return "BEN001";

  const num = parseInt(last.beneficiary_id.replace("BEN", "")) + 1;
  return "BEN" + num.toString().padStart(3, "0");
}

async function getNextCampaignId() {
  const last = await Campaign.findOne().sort({ campaign_id: -1 });
  if (!last) return "CMP001";

  const num = parseInt(last.campaign_id.replace("CMP", "")) + 1;
  return "CMP" + num.toString().padStart(3, "0");
}

async function getNextFileId() {
  const last = await CampaignFile.findOne().sort({ file_id: -1 });
  if (!last) return "FILE001";

  const num = parseInt(last.file_id.replace("FILE", "")) + 1;
  return "FILE" + num.toString().padStart(3, "0");
}

async function getNextImageId() {
  const last = await CampaignImage.findOne().sort({ image_id: -1 });
  if (!last) return "IMG001";

  const num = parseInt(last.image_id.replace("IMG", "")) + 1;
  return "IMG" + num.toString().padStart(3, "0");
}

async function adminAssigned() {
  const admins = await Admin.find().sort({ admin_id: 1 });

  const lastCampaign = await Campaign.findOne().sort({ campaign_id: -1 });

  if (!lastCampaign) return admins[0].admin_id;

  const currentIndex = admins.findIndex(
    (a) => a.admin_id === lastCampaign.admin_id
  );

  return admins[(currentIndex + 1) % admins.length].admin_id;
}

export default router;
