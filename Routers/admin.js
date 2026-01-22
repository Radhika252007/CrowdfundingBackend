import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
  adminLogin,
  registerAdmin,
  getAllUsers,
  getAllCampaigns,
  getAdminCampaigns,
  approveCampaign,
  getAllDonations
} from '../controllers/adminController.js';

const router = express.Router();

// Admin login
router.post('/login', adminLogin);

// Register new admin
router.post('/register', registerAdmin);

// Protected routes
router.use(adminAuth);

// Get all users
router.get('/users', getAllUsers);

// Get all campaigns
// Get all campaigns
router.get("/campaigns", getAllCampaigns);
router.get("/mycampaigns", getAdminCampaigns);


// Approve a campaign
router.patch("/campaign/:id/approve", approveCampaign);

// Get all donations
router.get("/donations", getAllDonations);

export default router;
