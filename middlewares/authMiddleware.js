// This file is deprecated - use middlewares/auth.js instead
// Keeping this file to avoid import errors, but it's no longer used

export const protectEducator = (req, res, next) => {
    // This middleware is deprecated
    // Use authenticateToken and requireRole from middlewares/auth.js instead
    next();
};