import express from 'express';
import { authenticateUser } from './auth.js';

import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';

const router = express.Router();

// ------------------- MAKE A DONATION -------------------
router.post('/donation/:campaignId', authenticateUser, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { donationAmount, paymentMethod } = req.body;
    const userId = req.user.id; // from authenticateUser middleware

    // Fetch campaign + raised amount from donations
    const campaign = await Campaign.findOne({ campaign_id: campaignId }).lean();
    if (!campaign)
      return res.status(404).json({ error: 'Campaign not found' });

    // Calculate total raised so far from MongoDB
    const raisedData = await Donation.aggregate([
      { $match: { campaign_id: campaignId } },
      { $group: { _id: null, raised_amount: { $sum: '$amount' } } }
    ]);

    const raised_amount = raisedData.length ? raisedData[0].raised_amount : 0;

    const mergedCampaign = {
      ...campaign,
      raised_amount,
      goal_amount: campaign.goal_amount,
    };

    // Validate donation
    const check = checkDonation(donationAmount, mergedCampaign);
    if (check.status === 'error')
      return res.status(400).json({ message: check.message });

    // Generate new donation ID
    const donation_id = await getNextDonationId();

    // Insert donation
    await Donation.create({
      donation_id,
      user_id: userId,
      campaign_id: campaignId,
      amount: donationAmount,
      transaction_type: paymentMethod,
      donation_date: new Date(),
    });

    res.status(201).json({
      message: 'Donation initiated successfully',
      donation_id,
    });

  } catch (error) {
    console.error('Donation Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ------------------- VALIDATE DONATION -------------------
function checkDonation(donationAmount, campaign) {
  const raised = Number(campaign.raised_amount);
  const goal = Number(campaign.goal_amount);
  const amount = Number(donationAmount);

  if (raised + amount > goal) {
    return { status: 'error', message: 'Donation exceeds approved goal' };
  }

  return { status: 'success', message: 'Donation accepted, pending confirmation' };
}

// ------------------- GENERATE DONATION ID -------------------
async function getNextDonationId() {
  const last = await Donation.findOne().sort({ donation_id: -1 }).lean();

  if (!last) return 'DON001';

  const lastId = last.donation_id;
  const num = parseInt(lastId.replace('DON', '')) + 1;

  return 'DON' + num.toString().padStart(3, '0');
}

export default router;