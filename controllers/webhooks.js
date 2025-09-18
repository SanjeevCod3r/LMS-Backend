import crypto from "crypto";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";
import User from "../models/User.js";


// Razorpay Webhook Handler
export const razorpayWebhook = async (request, response) => {
    try {
        const webhookSignature = request.headers['x-razorpay-signature'];
        const webhookBody = JSON.stringify(request.body);
        
        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(webhookBody)
            .digest('hex');

        if (webhookSignature !== expectedSignature) {
            return response.status(400).json({ error: 'Invalid signature' });
        }

        const event = request.body;

        switch (event.event) {
            case 'payment.captured':
                await handlePaymentCaptured(event.payload.payment.entity);
                break;
            
            case 'payment.failed':
                await handlePaymentFailed(event.payload.payment.entity);
                break;
            
            default:
                console.log(`Unhandled event type: ${event.event}`);
        }

        response.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        response.status(500).json({ error: 'Webhook processing failed' });
    }
};

const handlePaymentCaptured = async (payment) => {
    try {
        const orderId = payment.order_id;
        
        // Find purchase by Razorpay order ID
        const purchaseData = await Purchase.findOne({ razorpayOrderId: orderId });
        
        if (!purchaseData) {
            console.error("No purchase found for order ID:", orderId);
            return;
        }

        // Get user and course data
        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(purchaseData.courseId);

        if (!userData || !courseData) {
            console.error("User or Course not found");
            return;
        }

        // Update purchase record
        purchaseData.paymentStatus = 'completed';
        purchaseData.razorpayPaymentId = payment.id;
        await purchaseData.save();

        // Enroll user in course
        if (!userData.enrolledCourses.includes(courseData._id)) {
            userData.enrolledCourses.push(courseData._id);
            await userData.save();
        }

        if (!courseData.enrolledStudents.includes(userData._id)) {
            courseData.enrolledStudents.push(userData._id);
            await courseData.save();
        }

        console.log(`Payment captured and enrollment completed for user ${userData._id} in course ${courseData._id}`);
    } catch (error) {
        console.error("Error handling payment captured:", error);
    }
};

const handlePaymentFailed = async (payment) => {
    try {
        const orderId = payment.order_id;
        
        // Find purchase by Razorpay order ID
        const purchaseData = await Purchase.findOne({ razorpayOrderId: orderId });
        
        if (!purchaseData) {
            console.error("No purchase found for order ID:", orderId);
            return;
        }

        // Update purchase status
        purchaseData.paymentStatus = 'failed';
        await purchaseData.save();

        console.log(`Payment failed for order ${orderId}`);
    } catch (error) {
        console.error("Error handling payment failure:", error);
    }
};




