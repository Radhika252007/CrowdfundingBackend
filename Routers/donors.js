import express from 'express';
import { authenticateUser } from './auth.js';
import { makeDonation } from '../controllers/donationController.js';

const router = express.Router();

// Make a donation
router.post('/donation/:campaignId', authenticateUser, makeDonation);

export default router;