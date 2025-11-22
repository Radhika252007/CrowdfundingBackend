import express from "express";
import Update from "../models/Update.js";

const router = express.Router();

// ----------- GET ALL UPDATES FOR A CAMPAIGN ---------------
router.get("/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;

    const updates = await Update.find({ campaign_id: campaignId })
      .sort({ created_at: -1 });

    if (updates.length === 0) {
      return res.json({ message: "No updates found for this campaign" });
    }

    res.json(updates);

  } catch (error) {
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

export default router;