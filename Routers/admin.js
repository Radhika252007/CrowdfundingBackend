import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
  adminLogin,
  registerAdmin,
  getAllUsers,
  getAllCampaigns,
  getAdminCampaigns,
  approveCampaign,
  getAllDonations
} from '../controllers/adminController.js';

const router = express.Router();

// Admin login
router.post('/login', adminLogin);

// Register new admin
router.post('/register', registerAdmin);

// Protected routes
router.use(adminAuth);

// Get all users
router.get('/users', getAllUsers);

// Get all campaigns
// Get all campaigns
router.get("/campaigns", async (req, res) => {
  try {
    const { status, category } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (category) filter.category_id = category;

    let campaigns = await Campaign.find(filter)
      .populate("user_id", "name email")      // Owner
      .lean();

    for (let campaign of campaigns) {

      // ⭐ Fetch Category Name instead of ID
      if (campaign.category_id) {
        const cat = await Category.findOne({ category_id: campaign.category_id });
        campaign.category_name = cat ? cat.name : "Unknown";
      }

      // ⭐ Fetch total raised amount
      const donations = await Donation.find({ campaign_id: campaign.campaign_id });
      campaign.raisedAmount = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

      // existing image + file fetch
      campaign.images = await CampaignImage.find({ campaign_id: campaign.campaign_id });
      campaign.files = await CampaignFile.find({ campaign_id: campaign.campaign_id });
    }
    console.log(campaigns);
    res.json(campaigns);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});
router.get("/mycampaigns", async (req, res) => {
  console.log("Admin ID from token:", req.admin.admin_id);

  try {
    const { status, category } = req.query;

    let filter = { admin_id: req.admin.admin_id };

    if (status) filter.status = status;
    if (category) filter.category_id = category;

    let campaigns = await Campaign.find(filter)
      .populate("user_id", "name email")
      .lean();

    for (let campaign of campaigns) {
      if (campaign.category_id) {
        const cat = await Category.findOne({ category_id: campaign.category_id });
        campaign.category_name = cat ? cat.name : "Unknown";
      }

      const donations = await Donation.find({ campaign_id: campaign.campaign_id });
      campaign.raisedAmount = donations.reduce(
        (sum, d) => sum + Number(d.amount || 0),
        0
      );

      campaign.images = await CampaignImage.find({ campaign_id: campaign.campaign_id });
      campaign.files = await CampaignFile.find({ campaign_id: campaign.campaign_id });
    }

    res.json(campaigns);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// Approve a campaign
router.patch("/campaign/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findOneAndUpdate(
      { campaign_id: id },
      { status: "Approved" },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all donations
router.get("/donations", async (req, res) => {
  try {
    const donations = await Donation.find({}).populate("user_id", "name email").lean();
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
async function generateAdminId() {
  const count = await Admin.countDocuments(); // count existing admins
  const nextId = count + 1; // next number
  return "ADM" + String(nextId).padStart(3, "0"); // ADM001, ADM002, .
}

export default router;
