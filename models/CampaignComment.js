import mongoose from "mongoose";

const campaignCommentSchema = new mongoose.Schema({
  comment_id: { type: String, required: true, unique: true },
  campaign_id: { type: String },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comment_text: { type: String, required: true },
  comment_date: { type: Date, default: Date.now }
});

export default mongoose.model("CampaignComment", campaignCommentSchema);
