import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js';
import { razorpayWebhook } from './controllers/webhooks.js';
import educatorRouter from './routes/educatorRoutes.js';
import connectCloudinay from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
import authRouter from './routes/authRoutes.js';

// initialize express 
const app = express();


// connect to db
await connectDB();
await connectCloudinay();


// middleware
app.use(cors());
app.use(express.json());


// Routes
app.get('/', (req,res)=>{res.send("Edemy API is working fine!")})
app.use('/api/auth', authRouter);
app.use('/api/educator', educatorRouter);
app.use('/api/course', courseRouter);
app.use('/api/user', userRouter);
app.post('/razorpay-webhook', express.raw({type: 'application/json'}), razorpayWebhook);



// port
const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> {
    console.log(`Server is running on ${PORT}`);
    
})