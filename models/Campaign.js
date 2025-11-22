// models/Campaign.js
import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
  campaign_id: { type: String, required: true, unique: true },

  title: { type: String, required: true },
  description: { type: String },
  goal_amount: { type: Number },

  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },

  start_date: { type: Date },
  end_date: { type: Date },

  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Beneficiary reference
  beneficiary_id: {
    type: String,
    ref: "Beneficiary",
    required: true,
  },

  // Category reference
  category_id: {
    type: String,
    ref: "Category",
    required: true,
  },

  admin_id: { type: String },

  warning: {
    type: String,
    enum: ["None", "Warning"],
    default: "None",
  },
}, { timestamps: true });

export default mongoose.model("Campaign", campaignSchema);
