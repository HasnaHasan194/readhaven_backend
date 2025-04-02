import dotenv from 'dotenv';
import mongoose from 'mongoose';
import  express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import UserRoute from './Routes/userRouter.js';
import AdminRoute from './Routes/adminRouter.js';
import morgan from 'morgan';
import { STATUS_CODES } from './utils/constants.js';
//import AdminRoute from './Routes/adminRouter.js';
dotenv.config()

const app=express();
app.use(express.json());
app.use(cookieParser());


app.use(cors({
    origin:globalThis.process.env.FRONT_END_URL,
    credentials:true,
}));
app.use(morgan('dev'));

mongoose.connect(globalThis.process.env.MONGO_URL)
.then(()=>console.log("mongodb connected"))
.catch((error)=>console.log(error))

app.use('/api/users',UserRoute)
app.use('/api/admin',AdminRoute)

app.use((err,req,res)=>{
    console.log("Error:",err.message);
    const statusCode = err.statusCode || STATUS_CODES. SERVER_ERROR;
    const message =err.message || "internal Server  error";

    return res.status(statusCode).json({
        success:false,
        message:message,
    });
});

const  PORT=globalThis.process.env.PORT
app.listen(PORT,console.log(`running on port ${PORT}`));

