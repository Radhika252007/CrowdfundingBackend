import mongoose from "mongoose";

const campaignShareSchema = new mongoose.Schema({
  share_id: { type: String, required: true, unique: true },
  campaign_id: { type: String },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  share_platform: { type: String },
  share_date: { type: Date, default: Date.now }
});

export default mongoose.model("CampaignShare", campaignShareSchema);
