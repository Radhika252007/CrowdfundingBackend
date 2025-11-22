import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  donation_id: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  campaign_id: { type: String, required: true },
  amount: { type: Number, required: true },

  transaction_type: {
    type: String,
    enum: ['upi','card','netbanking','wallet'],
    required: true
  },

  donation_date: { type: Date, default: Date.now }
});

export default mongoose.model("Donation", donationSchema);
