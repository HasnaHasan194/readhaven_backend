import dotenv from "dotenv" ;
dotenv.config();
 
//importing nodemailer for sending email
import nodemailer from "nodemailer";



const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS,

        
    },
});
export const otpSender=async(email,otp,next)=>{
    
    const mailOptions={
        from:"READHAVEN",
        to:email,
        subject:"Your OTP for Signup",
        text:`Your OTP code for signup is :${otp}`,

    };
   
    transporter.sendMail(mailOptions,(err,info)=>{
        if(err){
            console.log(err);
            return next(errorHandler(500,"failed to send OTP"))

        }
        
        res.status(200).json({success:true,message:"OTP sent to your given email.please verify."});
    });
}

