import express from 'express';
import { getCampaignUpdates } from '../controllers/updateController.js';

const router = express.Router();

// Get all updates for a campaign
router.get('/:campaignId', getCampaignUpdates);

export default router;