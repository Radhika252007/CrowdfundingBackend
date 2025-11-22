import express from 'express';
import Campaign from '../models/Campaign.js';
import CampaignImage from '../models/CampaignImage.js';
import Donation from '../models/Donation.js';
import Beneficiary from '../models/Beneficiary.js';
import Update from '../models/Update.js';
import Category from '../models/Category.js'
import CampaignComment from '../models/CampaignComment.js';
import CampaignShare from '../models/CampaignShare.js';
import { authenticateUser, authorizeRole } from './auth.js';

const router = express.Router();

// ------------------- GET ALL CAMPAIGNS -------------------
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('user_id', 'name user_image')
      .lean();

    const campaignsWithExtras = await Promise.all(
      campaigns.map(async (campaign) => {
        const images = await CampaignImage.find({ campaign_id: campaign.campaign_id }).lean();
        campaign.images = images.map(img => img.image_path);

        const donations = await Donation.find({ campaign_id: campaign.campaign_id }).lean();
        campaign.raised_amount = donations.reduce((sum, d) => sum + d.amount, 0);
        campaign.noOfDonations = donations.length;

        return campaign;
      })
    );

    res.status(200).json(campaignsWithExtras);
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ------------------- GET CAMPAIGNS BY CATEGORY -------------------
router.get('/category/:categoryName', async (req, res) => {
  const { categoryName } = req.params;

  try {
    // 1️⃣ Find the category document
    const category = await Category.findOne({ name: categoryName }).lean();
    if (!category) return res.status(404).json({ error: "Category not found" });

    // 2️⃣ Find campaigns with that category_id
    const campaigns = await Campaign.find({ category_id: category._id })
      .populate('user_id', 'name user_image')
      .lean();

    if (!campaigns.length) return res.status(404).json({ error: "No campaigns found for this category" });

    // 3️⃣ Add images and donation info
    const campaignsWithExtras = await Promise.all(
      campaigns.map(async (campaign) => {
        const images = await CampaignImage.find({ campaign_id: campaign.campaign_id }).lean();
        campaign.images = images.map(img => img.image_path);

        const donations = await Donation.find({ campaign_id: campaign.campaign_id }).lean();
        campaign.raised_amount = donations.reduce((sum, d) => sum + d.amount, 0);
        campaign.noOfDonations = donations.length;

        return campaign;
      })
    );

    res.status(200).json(campaignsWithExtras);

  } catch (err) {
    console.error("Error fetching category campaigns:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ------------------- GET CAMPAIGN BY ID -------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const campaign = await Campaign.findOne({ campaign_id: id })
      .populate('user_id', 'name user_image')
      .lean();

    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const images = await CampaignImage.find({ campaign_id: id }).lean();
    campaign.images = images.map(img => img.image_path);

    const donations = await Donation.find({ campaign_id: id }).lean();
    campaign.raised_amount = donations.reduce((sum, d) => sum + d.amount, 0);
    campaign.noOfDonations = donations.length;

    res.status(200).json(campaign);
  } catch (err) {
    console.error("Error fetching campaign by ID:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ------------------- GET CAMPAIGNER INFO -------------------
router.get('/:id/campaigner', async (req, res) => {
  const { id } = req.params;
  try {
    const campaign = await Campaign.findOne({ campaign_id: id })
      .populate('user_id', 'name user_image')
      .lean();

    if (!campaign) return res.status(404).json({ error: "Creator not found" });

    res.status(200).json(campaign.user_id);
  } catch (err) {
    console.error("Error fetching campaigner:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ------------------- GET BENEFICIARY -------------------
router.get('/:id/beneficiary', async (req, res) => {
  const { id } = req.params;
  try {
    const campaign = await Campaign.findOne({ campaign_id: id }).lean();
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const beneficiary = await Beneficiary.findOne({ beneficiary_id: campaign.beneficiary_id }).lean();
    if (!beneficiary) return res.status(404).json({ error: "No Beneficiary Provided" });

    res.status(200).json({ beneficiary_name: beneficiary.beneficiary_name });
  } catch (err) {
    console.error("Error fetching beneficiary:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ------------------- POST CAMPAIGN UPDATE -------------------
router.post('/:id/update', authenticateUser, authorizeRole('Both'), async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { update_text } = req.body;

  if (!update_text) return res.status(400).json({ message: "Update text is required" });

  try {
    const campaign = await Campaign.findOne({ campaign_id: id });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    if (campaign.user_id.toString() !== userId) return res.status(403).json({ message: "You are not authorized" });

    const lastUpdate = await Update.findOne().sort({ _id: -1 }).lean();
    const lastId = lastUpdate ? lastUpdate.update_id : "UPD000";
    const num = parseInt(lastId.replace('UPD', '')) + 1;
    const newUpdateId = 'UPD' + num.toString().padStart(3, '0');

    const newUpdate = await Update.create({
      update_id: newUpdateId,
      update_text,
      campaign_id: id
    });

    res.status(201).json({ message: "Campaign update posted successfully", update_id: newUpdate.update_id });
  } catch (err) {
    console.error("Error posting update:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

router.get('/recent-donors/:id', async (req, res) => {
    try {
        const campaignId = req.params.id;

        const recentDonors = await Donation.find({ campaign_id: campaignId })
            .sort({ created_at: -1 })
            .limit(5)
            .populate("user_id", "name email user_image") // fetch user details
            .lean();

        res.json(recentDonors);

    } catch (err) {
        res.status(500).json({ message: "Error fetching donors", error: err.message });
    }
});
// GET all comments for a campaign
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await CampaignComment.find({ campaign_id: req.params.id })
      .populate('user_id', 'name')
      .sort({ comment_date: -1 })
      .lean();

    const formatted = comments.map(c => ({
      comment_id: c.comment_id,
      comment_text: c.comment_text,
      comment_date: c.comment_date,
      user_name: c.user_id?.name || 'User'
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
});


router.post('/:id/comment', authenticateUser, async (req, res) => {
  try {
    const { comment_text } = req.body;
    if (!comment_text) return res.status(400).json({ message: 'Comment text required' });

    const lastComment = await CampaignComment.findOne().sort({ _id: -1 }).lean();
    const lastId = lastComment ? lastComment.comment_id : 'COM000';
    const num = parseInt(lastId.replace('COM', '')) + 1;
    const newCommentId = 'COM' + num.toString().padStart(3, '0');

    const newComment = await CampaignComment.create({
      comment_id: newCommentId,
      campaign_id: req.params.id,
      user_id: req.user.id,
      comment_text
    });

    res.status(201).json({ message: 'Comment posted', comment_id: newComment.comment_id });
  } catch (err) {
    res.status(500).json({ message: 'Error posting comment', error: err.message });
  }
});

// POST a share
router.post('/:id/share', authenticateUser, async (req, res) => {
  try {
    const { share_platform } = req.body;
    const lastShare = await CampaignShare.findOne().sort({ _id: -1 }).lean();
    const lastId = lastShare ? lastShare.share_id : 'SH000';
    const num = parseInt(lastId.replace('SH', '')) + 1;
    const newShareId = 'SH' + num.toString().padStart(3, '0');

    const newShare = await CampaignShare.create({
      share_id: newShareId,
      campaign_id: req.params.id,
      user_id: req.user.id,
      share_platform
    });

    res.status(201).json({ message: 'Campaign shared', share_id: newShare.share_id });
  } catch (err) {
    res.status(500).json({ message: 'Error sharing', error: err.message });
  }
});


export { router as campaignRouter };
