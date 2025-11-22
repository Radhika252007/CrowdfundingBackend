import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

// Setup Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder = "others"; // default
    if (file.fieldname === "images") folder = "campaign/images";
    else if (file.fieldname === "files") folder = "campaign/files";
    else if (file.fieldname === "profileImage") folder = "users";

    return {
      folder: folder,
      allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
      transformation: [{ width: 800, height: 800, crop: "limit" }], 
    };
  },
});

// File type validation
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "images" || file.fieldname === "profileImage") {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images are allowed!"), false);
  } else if (file.fieldname === "files") {
    if (file.mimetype === "application/pdf" || file.mimetype.includes("msword"))
      cb(null, true);
    else cb(new Error("Only PDF or DOC files are allowed!"), false);
  } else cb(null, false);
};

const upload = multer({ storage, fileFilter });

export default upload;
