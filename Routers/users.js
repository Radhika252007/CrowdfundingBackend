import express from 'express';
import upload from '../config/multerCloudinaryConfig.js';
import { authenticateUser, authorizeRole } from './auth.js';

import { getUserCampaigns } from '../controllers/userController.js';
import { getUserProfile } from '../controllers/userController.js';
import { updateUserProfile } from '../controllers/userController.js';
import { getUserDonations } from '../controllers/userController.js';
import { getUserCampaign } from '../controllers/userController.js';
import { getCampaignDashboardStats } from '../controllers/userController.js';   

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
