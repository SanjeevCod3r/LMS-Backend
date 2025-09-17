import User from '../models/User.js';
import { generateToken } from '../middlewares/auth.js';

// Register new user
export const register = async (req, res) => {
    try {
        const { name, email, password, role = 'student' } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            role
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Return user data without password
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            enrolledCourses: user.enrolledCourses,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: userData
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Return user data without password
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            enrolledCourses: user.enrolledCourses,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userData
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const user = req.user; // From auth middleware

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                imageUrl: user.imageUrl,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                enrolledCourses: user.enrolledCourses,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { name, imageUrl } = req.body;
        const userId = req.user._id;

        const updateData = {};
        if (name) updateData.name = name;
        if (imageUrl) updateData.imageUrl = imageUrl;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while changing password'
        });
    }
};

// Logout (client-side token removal, but we can track it server-side if needed)
export const logout = async (req, res) => {
    try {
        // In a JWT system, logout is typically handled client-side by removing the token
        // But we can add server-side logic here if needed (like token blacklisting)
        
        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};
