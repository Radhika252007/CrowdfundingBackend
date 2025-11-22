import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  about_user: { type: String },
  user_role: { type: String, enum: ["Donor", "Both"], default: "Donor" },
  password: { type: String },
  dob: { type: Date },
  user_image: { type: String },
}, { timestamps: true });

export default mongoose.model("User", userSchema);