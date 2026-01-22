// Authentication Controller
// Handles user registration, login, token refresh, and logout

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const SALT_ROUNDS = 10;
let refreshTokens = [];

/**
 * Register a new user
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, location, about_user, dob } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and Password required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Cloudinary image URL
    const user_image = req.file ? req.file.path : null;

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      location,
      about_user,
      dob,
      user_image,
      user_role: 'Donor'
    });

    // JWT tokens
    const payload = {
      id: newUser._id,
      email: newUser.email,
      user_role: newUser.user_role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET_KEY, {
      expiresIn: '7d'
    });

    refreshTokens.push(refreshToken);

    res.status(201).json({
      message: 'User Registered Successfully',
      accessToken,
      refreshToken,
      user_image
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Login user
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const payload = {
      id: user._id,
      email: user.email,
      user_role: user.user_role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET_KEY, {
      expiresIn: '7d'
    });

    refreshTokens.push(refreshToken);

    res.json({
      message: 'Login Successful',
      accessToken,
      refreshToken,
      user_image: user.user_image
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  if (!refreshTokens.includes(token)) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }

  jwt.verify(token, process.env.REFRESH_SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Refresh token expired' });

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      user_role: user.user_role
    });

    res.status(200).json({
      message: 'Token refreshed',
      accessToken: newAccessToken
    });
  });
};

/**
 * Logout user
 */
export const logoutUser = (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.status(200).json({ message: 'Logout Successful' });
};

/**
 * Generate JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_SECRET_KEY, {
    expiresIn: '3h'
  });
}
