// Fundraiser Controller
// Handles campaign creation with images, files, and beneficiary setup

import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import Campaign from '../models/Campaign.js';
import Category from '../models/Category.js';
import Beneficiary from '../models/Beneficiary.js';
import CampaignImage from '../models/CampaignImage.js';
import CampaignFile from '../models/CampaignFile.js';
import User from '../models/User.js';
import {
  getNextCampaignId,
  getNextBeneficiaryId,
  getNextImageId,
  getNextFileId,
  assignAdminRoundRobin
} from '../utils/idGenerator.js';

/**
 * Upload file to Cloudinary
 */
async function uploadToCloudinary(buffer, folder, resource_type = 'image') {
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

/**
 * Create a new campaign with images, files, and beneficiary
 */
export const createCampaign = async (req, res) => {
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
      beneficiary_address
    } = req.body;

    const user_id = req.user.id;

    // Find category
    const categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category_id = categoryDoc.category_id;

    // Find or create beneficiary
    let beneficiary = await Beneficiary.findOne({
      beneficiary_name,
      address: beneficiary_address
    });

    let beneficiary_id;
    if (!beneficiary) {
      beneficiary_id = await getNextBeneficiaryId();
      beneficiary = await Beneficiary.create({
        beneficiary_id,
        beneficiary_name,
        type: beneficiary_type,
        description: beneficiary_description,
        address: beneficiary_address
      });
    } else {
      beneficiary_id = beneficiary.beneficiary_id;
    }

    // Check if campaign already exists
    const existing = await Campaign.findOne({
      title,
      beneficiary_id
    });

    if (existing) {
      return res.status(409).json({ message: 'Campaign already exists for this beneficiary' });
    }

    // Assign admin
    const admin_id = await assignAdminRoundRobin();

    // Create campaign
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
      status: 'Pending'
    });

    // Upload images
    if (req.files && req.files.images) {
      for (let file of req.files.images) {
        const result = await uploadToCloudinary(file.buffer, 'campaign/images');
        const image_id = await getNextImageId();

        await CampaignImage.create({
          image_id,
          campaign_id,
          image_path: result.secure_url
        });
      }
    }

    // Upload files
    if (req.files && req.files.files) {
      for (let file of req.files.files) {
        const result = await uploadToCloudinary(file.buffer, 'campaign/files', 'raw');
        const file_id = await getNextFileId();

        await CampaignFile.create({
          file_id,
          campaign_id,
          file_path: result.secure_url
        });
      }
    }

    // Update user role if they were only a donor
    const user = await User.findById(user_id);
    if (user.user_role === 'Donor') {
      await User.updateOne({ _id: user_id }, { $set: { user_role: 'Both' } });
    }

    return res.status(201).json({
      message: 'Campaign created successfully',
      campaign_id,
      admin_id
    });

  } catch (err) {
    console.error('ERROR:', err);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message
    });
  }
};
