import Razorpay from "razorpay"
import Course from "../models/Course.js"
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"
import { CourseProgress } from "../models/CourseProgress.js"
import crypto from "crypto"

// Get users data
export const getUserData = async(req,res)=>{
    try {
        const userId = req.user._id
        const user = await User.findById(userId)
        if(!user){
            return res.json({success: false, message:"User not found!"})
        }

        res.json({success: true, user});
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}

// User enrolled course with lecture link

export const userEnrolledCourses = async (req,res)=>{
    try {
        const userId = req.user._id
        const userData = await User.findById(userId).populate('enrolledCourses')

        res.json({success:true, enrolledCourses: userData.enrolledCourses})


    } catch (error) {
        res.json({success: false, message:error.message})
    }
}


// Purchase course

export const purchaseCourse = async (req,res) => {
    try {
        const {courseId} = req.body
        const {origin} = req.headers
        const userId = req.user._id;

        const userData = await User.findById(userId)
        const courseData = await Course.findById(courseId)
        
        if(!userData || !courseData) {
            return res.json({success: false, message: "Data Not Found"})
        }

        // Check if user is already enrolled
        if(userData.enrolledCourses.includes(courseId)) {
            return res.json({success: false, message: "Already enrolled in this course"})
        }

        const finalPrice = (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2);

        // Handle free courses
        if(parseFloat(finalPrice) === 0.00) {
            // Directly enroll user in free course
            userData.enrolledCourses.push(courseId);
            courseData.enrolledStudents.push(userId);
            
            await userData.save();
            await courseData.save();

            // Create a purchase record for free course
            await Purchase.create({
                courseId: courseData._id,
                userId,
                amount: 0,
                paymentStatus: 'completed'
            });

            return res.json({
                success: true, 
                message: "Successfully enrolled in free course!",
                redirect: "/my-enrollments"
            });
        }

        // Handle paid courses with Razorpay
        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: finalPrice,
        }

        const newPurchase = await Purchase.create(purchaseData);

        // Initialize Razorpay instance
        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        // Create Razorpay order
        const options = {
            amount: Math.round(parseFloat(finalPrice) * 100), // Amount in paise (smallest currency unit)
            currency: process.env.CURRENCY || 'INR',
            receipt: `receipt_${newPurchase._id}`,
            notes: {
                courseId: courseData._id.toString(),
                userId: userId.toString(),
                purchaseId: newPurchase._id.toString(),
                courseName: courseData.courseTitle
            }
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        // Update purchase with Razorpay order ID
        newPurchase.razorpayOrderId = razorpayOrder.id;
        await newPurchase.save();

        res.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            courseName: courseData.courseTitle,
            purchaseId: newPurchase._id
        })

    } catch (error) {
        res.json({success: false, message:error.message})
    }
}

// Verify Razorpay payment
export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseId } = req.body;

        // Create signature for verification
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.json({ success: false, message: "Payment verification failed" });
        }

        // Find the purchase record
        const purchaseData = await Purchase.findById(purchaseId);
        if (!purchaseData) {
            return res.json({ success: false, message: "Purchase record not found" });
        }

        // Get user and course data
        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(purchaseData.courseId);

        if (!userData || !courseData) {
            return res.json({ success: false, message: "User or Course not found" });
        }

        // Update purchase record
        purchaseData.paymentStatus = 'completed';
        purchaseData.razorpayPaymentId = razorpay_payment_id;
        purchaseData.razorpaySignature = razorpay_signature;
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

        res.json({
            success: true,
            message: "Payment verified and enrollment completed successfully!"
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update user Course progress

export const updateUserCourseProgress = async(req,res)=>{
    try {
        const userId = req.user._id
        const {courseId, lectureId} = req.body
        const progressData = await CourseProgress.findOne({userId, courseId})

        if(progressData){
            if(progressData.lectureCompleted.includes(lectureId)){
                return res.json({success: true, message: "Lecture Already Completed"})
            }
            
            progressData.lectureCompleted.push(lectureId)
            progressData.completed = true
            await progressData.save()
        }
        else{
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]

            })
        }
        res.json({success:true, message: 'Progress Updated'})
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}

// get user course progress

export const getUserCourseProgress = async(req,res)=>{
    try {
        const userId = req.user._id
        const {courseId} = req.body
        const progressData = await CourseProgress.findOne({userId, courseId})
        res.json({success: true, progressData})
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}


// Add user ratings to course

export const addUserRating = async (req,res)=>{
    try {
        const userId = req.user._id
        const {courseId, rating} = req.body
        // console.log("UserId", courseId);
        // console.log("courseId", courseId);
        // console.log("rating", rating);
        

        if(!courseId || !userId || !rating || rating < 1 || rating > 5)
        {
            res.json({success: false, message:"Invalid details"})
        }

        const course = await Course.findById(courseId)
        if(!course){
            return res.json({success: false, message:"Course Not found!"})
        }

        const user = await User.findById(userId)

        if(!user || !user.enrolledCourses.includes(courseId)){
            return res.json({success: false, message:"User has not purchased this course."})
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId)
        if(existingRatingIndex > -1){
            course.courseRatings[existingRatingIndex].rating = rating;
        }
        else{
            course.courseRatings.push({userId,rating});
        }

        // await courseData.save()
        await course.save()
        res.json({success: true, message:"Rating Added"})

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}