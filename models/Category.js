// models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  category_id: {
    type: String,
    required: true,
    unique: true,   
  },

  name: {
    type: String,
    required: true,
    unique: true,
    enum: [
      "Education",
      "Health",
      "Environment",
      "Women Empowerment",
      "Animal Welfare",
      "Disaster Relief",
      "Child Welfare",
      "Elderly Support",
      "Mental Health",
      "Medical Emergency",
      "Rural Development",
      "Human Rights",
      "Clean Water & Sanitation",
      "Food & Nutrition",
      "Orphan Care",
      "Community Development",
      "Refugee Support",
      "Disability Support",
      "Sports for Good",
      "Arts & Culture",
    ],
  },
});

export default mongoose.model("Category", categorySchema);
