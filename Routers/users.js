import express from 'express';
import bcrypt from 'bcrypt';
import upload from '../config/multerCloudinaryConfig.js';
import { authenticateUser, authorizeRole } from './auth.js';

import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import CampaignImage from '../models/CampaignImage.js';
import mongoose from 'mongoose';
import CampaignComment from '../models/CampaignComment.js';
import CampaignShare from '../models/CampaignShare.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateUser, getUserProfile);

// Update user profile
router.put('/profile', authenticateUser, upload.single('profileImage'), updateUserProfile);

// Get user campaigns
router.get('/usercampaigns', authenticateUser, authorizeRole('Both'), getUserCampaigns);

// Get single user campaign
router.get('/usercampaign/:id', authenticateUser, authorizeRole('Both'), getUserCampaign);

// Get user donations
router.get('/userdonations', authenticateUser, getUserDonations);

// Get dashboard stats
router.get('/dashboard-stats/:id', authenticateUser, authorizeRole('Both'), getCampaignDashboardStats);

export default router;
