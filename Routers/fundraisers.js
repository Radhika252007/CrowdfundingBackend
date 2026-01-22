import express from 'express';
import multer from 'multer';
import { authenticateUser } from './auth.js';
import { createCampaign } from '../controllers/fundraiserController.js';

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create campaign
router.post(
  '/campaignform',
  authenticateUser,
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'files', maxCount: 2 }
  ]),
  createCampaign
);

export default router;
