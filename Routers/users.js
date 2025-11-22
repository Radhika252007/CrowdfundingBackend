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

/* -----------------------------------------------
   GET USER PROFILE
------------------------------------------------ */
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();

        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/* -----------------------------------------------
   GET USER CAMPAIGNS
------------------------------------------------ */
// GET USER CAMPAIGNS
router.get('/usercampaigns', authenticateUser, authorizeRole("Both"), async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const campaigns = await Campaign.find({ user_id: userId }).lean();

    if (!campaigns || campaigns.length === 0) {
      return res.json([]);
    }

    const campaignsWithData = await Promise.all(
      campaigns.map(async (campaign) => {
        
        // ⭐ Fetch Images
        const images = await CampaignImage.find({ campaign_id: campaign.campaign_id });
        campaign.images = images.map(img => img.image_path) || [];

        // ⭐ Fetch Raised Amount
        const donations = await Donation.find({ campaign_id: campaign.campaign_id });

        const totalRaised = donations.reduce((sum, d) => {
          const amount = Number(d.amount) || 0;
          return sum + amount;
        }, 0);

        campaign.raisedAmount = totalRaised;

        return campaign;
      })
    );

    res.status(200).json(campaignsWithData);

  } catch (err) {
    console.error("Error fetching user campaigns:", err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});


/* -----------------------------------------------
   GET SINGLE USER CAMPAIGN
------------------------------------------------ */
router.get('/usercampaign/:id', authenticateUser, authorizeRole("Both"), async (req, res) => {
    try {
        const id = req.params.id;

        const campaign = await Campaign.findOne({ campaign_id: id }).lean();
        if (!campaign) return res.status(404).json({ error: "Campaign not found" });

        const images = await CampaignImage.find({ campaign_id: id });
        campaign.images = images.map(img => img.image_path);

        res.status(200).json(campaign);

    } catch (err) {
        res.status(500).send(err.message);
    }
});

/* -----------------------------------------------
   GET USER DONATIONS
------------------------------------------------ */
router.get('/userdonations', authenticateUser, async (req, res) => {
    try {
        const donations = await Donation.find({ user_id: req.user.id }).lean();

        res.json(donations); // return array even if empty
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.put('/profile', authenticateUser, upload.single('profileImage'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, password, about_user, location } = req.body;

        const updateData = { name, email, about_user, location };

        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (req.file) updateData.user_image = req.file.path;

        await User.findByIdAndUpdate(userId, updateData);

        res.status(200).json({ message: "Profile updated successfully" });

    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});


router.get('/dashboard-stats/:id', authenticateUser, authorizeRole("Both"), async (req, res) => {
    try {
        const campaignId = req.params.id;

        const campaign = await Campaign.findOne({ campaign_id: campaignId });
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const donations = await Donation.find({ campaign_id: campaignId });

        const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);

        const leftDonation = campaign.goal_amount - totalDonated;

        const goalAmount = campaign.goal_amount;

        // 🔹 Total donors (unique users)
        const totalDonors = new Set(donations.map(d => d.user_id.toString())).size;

        // 🔹 Donations today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const donationsToday = donations.filter(d => {
            const date = new Date(d.created_at);
            return date >= today;
        }).length;

        // 🔹 Average donation
        const avgDonation = donations.length === 0 ? 0 : totalDonated / donations.length;

        // 🔹 Comments count (if you have a Comment model)
        let totalComments = 0;
        if (mongoose.models.CampaignComment) {
            totalComments = await CampaignComment.countDocuments({ campaign_id: campaignId });
        }

        let totalShares = 0;
        if(mongoose.models.CampaignShare){
            totalShares = await CampaignShare.countDocuments({campaign_id: campaignId})
        }

        // 🔹 Days left
        const endDate = new Date(campaign.end_date);
        const current = new Date();
        const timeDiff = endDate - current;

        const daysLeft = timeDiff > 0 ? Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) : 0;

        return res.json({
            campaign_id: campaignId,
            totalDonated,
            goalAmount,
            leftDonation,
            totalDonors,
            donationsToday,
            avgDonation,
            totalComments,
            totalShares,
            daysLeft
        });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ message: "Something went wrong", error: err.message });
    }
});


export default router;
