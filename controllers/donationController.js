// Donation Controller
// Handles donation creation and validation

import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import { getNextDonationId } from '../utils/idGenerator.js';

/**
 * Validate donation amount against campaign goal
 */
function validateDonation(donationAmount, campaign) {
  const raised = Number(campaign.raised_amount);
  const goal = Number(campaign.goal_amount);
  const amount = Number(donationAmount);

  if (raised + amount > goal) {
    return { status: 'error', message: 'Donation exceeds approved goal' };
  }

  return { status: 'success', message: 'Donation accepted, pending confirmation' };
}

/**
 * Create a donation
 */
export const makeDonation = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { donationAmount, paymentMethod } = req.body;
    const userId = req.user.id;

    // Fetch campaign
    const campaign = await Campaign.findOne({ campaign_id: campaignId }).lean();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Calculate total raised so far
    const raisedData = await Donation.aggregate([
      { $match: { campaign_id: campaignId } },
      { $group: { _id: null, raised_amount: { $sum: '$amount' } } }
    ]);

    const raised_amount = raisedData.length ? raisedData[0].raised_amount : 0;

    const mergedCampaign = {
      ...campaign,
      raised_amount,
      goal_amount: campaign.goal_amount
    };

    // Validate donation
    const check = validateDonation(donationAmount, mergedCampaign);
    if (check.status === 'error') {
      return res.status(400).json({ message: check.message });
    }

    // Generate new donation ID
    const donation_id = await getNextDonationId();

    // Insert donation
    await Donation.create({
      donation_id,
      user_id: userId,
      campaign_id: campaignId,
      amount: donationAmount,
      transaction_type: paymentMethod,
      donation_date: new Date()
    });

    res.status(201).json({
      message: 'Donation initiated successfully',
      donation_id
    });

  } catch (error) {
    console.error('Donation Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
