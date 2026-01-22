import express from 'express';
import upload from '../config/multerCloudinaryConfig.js';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser
} from '../controllers/authController.js';
import { authenticateUser, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register user
router.post('/register', upload.single('profileImage'), registerUser);

// Login user
router.post('/login', loginUser);

// Refresh token
router.post('/token', refreshAccessToken);

// Logout user
router.delete('/logout', logoutUser);

export { router as authRouter, authenticateUser, authorizeRole };
