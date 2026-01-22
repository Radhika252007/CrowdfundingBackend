// Update Controller
// Handles campaign updates

import Update from '../models/Update.js';
import Campaign from '../models/Campaign.js';
import { getNextUpdateId } from '../utils/idGenerator.js';

/**
 * Get all updates for a campaign
 */
export const getCampaignUpdates = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const updates = await Update.find({ campaign_id: campaignId })
      .sort({ created_at: -1 });

    if (updates.length === 0) {
      return res.json({ message: 'No updates found for this campaign' });
    }

    res.json(updates);

  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
};

/**
 * Post a campaign update
 */
export const postCampaignUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { update_text } = req.body;

    if (!update_text) {
      return res.status(400).json({ message: 'Update text is required' });
    }

    const campaign = await Campaign.findOne({ campaign_id: id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.user_id.toString() !== userId) {
      return res.status(403).json({ message: 'You are not authorized' });
    }

    const updateId = await getNextUpdateId();

    const newUpdate = await Update.create({
      update_id: updateId,
      update_text,
      campaign_id: id
    });

    res.status(201).json({
      message: 'Campaign update posted successfully',
      update_id: newUpdate.update_id
    });

  } catch (err) {
    console.error('Error posting update:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};
