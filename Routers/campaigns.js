import express from 'express';
import { authenticateUser, authorizeRole } from './auth.js';
import {
  getAllCampaigns,
  getCampaignsByCategory,
  getCampaignById,
  getCampaignerInfo,
  getBeneficiaryInfo,
  getRecentDonors,
  getComments,
  postComment,
  shareCampaign
} from '../controllers/campaignController.js';
import { postCampaignUpdate } from '../controllers/updateController.js';

const router = express.Router();

// Get all campaigns
router.get('/', getAllCampaigns);

// Get campaigns by category
router.get('/category/:categoryName', getCampaignsByCategory);

// Get campaign by ID
router.get('/:id', getCampaignById);

// Get campaigner info
router.get('/:id/campaigner', getCampaignerInfo);

// Get beneficiary info
router.get('/:id/beneficiary', getBeneficiaryInfo);

// Post campaign update
router.post('/:id/update', authenticateUser, authorizeRole('Both'), postCampaignUpdate);

// Get recent donors
router.get('/recent-donors/:id', getRecentDonors);

// Get comments
router.get('/:id/comments', getComments);

// Post comment
router.post('/:id/comment', authenticateUser, postComment);

// Share campaign
router.post('/:id/share', authenticateUser, shareCampaign);

export { router as campaignRouter };
