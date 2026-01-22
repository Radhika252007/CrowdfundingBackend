// Authentication Middleware
// Handles JWT verification and role-based authorization

import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token and extract user info
 */
export function authenticateUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No Token Found' });
  }

  jwt.verify(token, process.env.ACCESS_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or Expired Token' });
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware to check user role
 * @param {string} role - Required role (e.g., 'Donor', 'Fundraiser', 'Both', 'Admin')
 */
export function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.user_role === role) {
      next();
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
  };
}
