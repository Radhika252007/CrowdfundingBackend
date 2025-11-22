import mongoose from "mongoose";

const campaignImageSchema = new mongoose.Schema({
  image_id: { type: String, required: true, unique: true },
  campaign_id: { type: String },
  image_path: { type: String }
});

export default mongoose.model("CampaignImage", campaignImageSchema);
