// models/Admin.js
import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    admin_id: {
      type: String,
      required: true,
      unique: true, // PRIMARY KEY in MySQL
    },

    admin_name: {
      type: String,
      required: true,
    },

    admin_email: {
      type: String,
      required: true,
      unique: true, // UNIQUE KEY admin_email
    },

    admin_pass: {
      type: String,
      required: true, // hashed password usually
    },
  },
  { timestamps: true } // optional
);

export default mongoose.model("Admin", AdminSchema);