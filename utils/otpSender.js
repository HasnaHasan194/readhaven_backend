import dotenv from "dotenv" ;
dotenv.config();
 
//importing nodemailer for sending email
import nodemailer from "nodemailer";
import { errorHandler } from "../Middlewares/error.js";
import { STATUS_CODES } from "./constants.js"; 


const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:globalThis.process.env.EMAIL_USER,
        pass:globalThis.process.env.EMAIL_PASS,

        
    },
});
export const otpSender=async(email,otp,res, next)=>{
    
    const mailOptions={
        from:"READHAVEN",
        to:email,
        subject:"Your OTP for Signup",
        text:`Your OTP code for signup is :${otp}`,

    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log(err);
        throw new Error("failed to send OTP");
    }
}



