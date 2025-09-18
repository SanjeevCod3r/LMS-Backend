import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
    courseId: {type: mongoose.Schema.Types.ObjectId,ref: 'Course',required: true},
    userId: {type: String,ref: 'User',required: true},
    amount: {type: Number,required: true},
    paymentStatus: {type: String, enum: ['pending', 'completed', 'failed'], default: 'pending'},
    // Razorpay specific fields
    razorpayOrderId: {type: String},
    razorpayPaymentId: {type: String},
    razorpaySignature: {type: String},
    // Legacy field for backward compatibility
    status: {type: String, enum: ['pending', 'completed', 'failed'], default: 'pending'},
},{timestamps: true});

export const Purchase = mongoose.model('Purchase', PurchaseSchema);