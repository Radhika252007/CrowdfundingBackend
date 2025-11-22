import mongoose from "mongoose";

const campaignFileSchema = new mongoose.Schema({
  file_id: { type: String, required: true, unique: true },
  campaign_id: { type: String },
  file_path: { type: String }
});

export default mongoose.model("CampaignFile", campaignFileSchema);
