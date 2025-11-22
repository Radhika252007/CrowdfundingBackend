// models/Beneficiary.js
import mongoose from "mongoose";

const BeneficiarySchema = new mongoose.Schema(
  {
    beneficiary_id: { type: String, required: true, unique: true },
    beneficiary_name: { type: String, required: true },

    type: {
      type: String,
      required: true,
      enum: [
        "Individual",
        "Family",
        "Child",
        "Student",
        "NGO",
        "Patient",
        "Community",
        "Animal Shelter",
        "School",
        "Hospital",
        "Refugee",
        "Elderly",
        "Disabled Person",
        "Women Empowerment Group",
      ],
    },

    description: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Beneficiary", BeneficiarySchema);
