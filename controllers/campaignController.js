// Campaign Controller
// Handles campaign creation, retrieval, and campaign-related operations

import Campaign from '../models/Campaign.js';
import CampaignImage from '../models/CampaignImage.js';
import Donation from '../models/Donation.js';
import Category from '../models/Category.js';
import CampaignComment from '../models/CampaignComment.js';
import CampaignShare from '../models/CampaignShare.js';
import Beneficiary from '../models/Beneficiary.js';
import { getNextCommentId, getNextShareId } from '../utils/idGenerator.js';

/**
 * Get all campaigns with images and donation info
 */
export const getAllCampaigns = async (req, res) => {
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
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get campaigns by category
 */
export const getCampaignsByCategory = async (req, res) => {
  const { categoryName } = req.params;

  try {
    // Find the category document
    const category = await Category.findOne({ name: categoryName }).lean();
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Find campaigns with that category_id
    const campaigns = await Campaign.find({ category_id: category.category_id })
      .populate('user_id', 'name user_image')
      .lean();

    if (!campaigns.length) {
      return res.status(404).json({ error: 'No campaigns found for this category' });
    }

    // Add images and donation info
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
    console.error('Error fetching category campaigns:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get single campaign by ID
 */
export const getCampaignById = async (req, res) => {
  const { id } = req.params;
  try {
    const campaign = await Campaign.findOne({ campaign_id: id })
      .populate('user_id', 'name user_image')
      .lean();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const images = await CampaignImage.find({ campaign_id: id }).lean();
    campaign.images = images.map(img => img.image_path);

    const donations = await Donation.find({ campaign_id: id }).lean();
    campaign.raised_amount = donations.reduce((sum, d) => sum + d.amount, 0);
    campaign.noOfDonations = donations.length;

    res.status(200).json(campaign);
  } catch (err) {
    console.error('Error fetching campaign by ID:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get campaigner (creator) info
 */
export const getCampaignerInfo = async (req, res) => {
  const { id } = req.params;
  try {
    const campaign = await Campaign.findOne({ campaign_id: id })
      .populate('user_id', 'name user_image')
      .lean();

    if (!campaign) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.status(200).json(campaign.user_id);
  } catch (err) {
    console.error('Error fetching campaigner:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get beneficiary info for a campaign
 */
export const getBeneficiaryInfo = async (req, res) => {
  const { id } = req.params;
  try {
    const campaign = await Campaign.findOne({ campaign_id: id }).lean();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const beneficiary = await Beneficiary.findOne({ beneficiary_id: campaign.beneficiary_id }).lean();
    if (!beneficiary) {
      return res.status(404).json({ error: 'No Beneficiary Provided' });
    }

    res.status(200).json({ beneficiary_name: beneficiary.beneficiary_name });
  } catch (err) {
    console.error('Error fetching beneficiary:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get recent donors for a campaign
 */
export const getRecentDonors = async (req, res) => {
  try {
    const campaignId = req.params.id;

    const recentDonors = await Donation.find({ campaign_id: campaignId })
      .sort({ created_at: -1 })
      .limit(5)
      .populate('user_id', 'name email user_image')
      .lean();

    res.json(recentDonors);

  } catch (err) {
    res.status(500).json({ message: 'Error fetching donors', error: err.message });
  }
};

/**
 * Get all comments for a campaign
 */
export const getComments = async (req, res) => {
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
};

/**
 * Post a comment on a campaign
 */
export const postComment = async (req, res) => {
  try {
    const { comment_text } = req.body;
    if (!comment_text) {
      return res.status(400).json({ message: 'Comment text required' });
    }

    const commentId = await getNextCommentId();

    const newComment = await CampaignComment.create({
      comment_id: commentId,
      campaign_id: req.params.id,
      user_id: req.user.id,
      comment_text
    });

    res.status(201).json({ message: 'Comment posted', comment_id: newComment.comment_id });
  } catch (err) {
    res.status(500).json({ message: 'Error posting comment', error: err.message });
  }
};

/**
 * Share a campaign
 */
export const shareCampaign = async (req, res) => {
  try {
    const { share_platform } = req.body;
    const shareId = await getNextShareId();

    const newShare = await CampaignShare.create({
      share_id: shareId,
      campaign_id: req.params.id,
      user_id: req.user.id,
      share_platform
    });

    res.status(201).json({ message: 'Campaign shared', share_id: newShare.share_id });
  } catch (err) {
    res.status(500).json({ message: 'Error sharing', error: err.message });
  }
};
