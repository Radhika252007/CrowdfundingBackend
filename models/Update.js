import mongoose from "mongoose";

const updateSchema = new mongoose.Schema({
  update_id: { type: String, required: true, unique: true },
  update_text: { type: String, required: true },
  campaign_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model("Update", updateSchema);
