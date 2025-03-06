import dotenv from 'dotenv';
dotenv.config();

import userDB from '../../Models/userSchema.js';
import otpDB from "../../Models/otpSchema.js";

import { otpSender } from '../../utils/otpSender.js';
import { generateOTP } from '../../utils/jwtTokens/generateOtp.js';

 
import bcrypt from 'bcrypt';
import { generateUserAccessToken } from '../../utils/jwtTokens/accessToken.js';
import { generateUserRefreshToken } from '../../utils/jwtTokens/refreshToken.js';
   //validation 

   const salt=10;
   //generate and send OTP

   export const generateAndSendOTP = async (req,res) => {
    let {email,firstName, lastName, phone, password, confirmPassword } = req.body;
   
    if(!email){
        return res.status(400).json({message : "Email is required"})
    }

    

    try{
        const userExist = await userDB.findOne({email});
        if(userExist) return res.status(409).json({message : "Email already exist.Please use a different Email"})

        const phoneExist = await userDB.findOne({phone});
        if(phoneExist) return res.status(409).json({message : "Phone Number already existed . Please use a different Phone Number"})


        await otpDB.deleteOne({email})    

        const otp = generateOTP();

        console.log(otp);
    
        const newOTP = new otpDB({email, otp, formData : req.body});
        await newOTP.save();

        await otpSender(email,otp);

        res.status(200).json({message : "OTP send successfully",email});
    }
    catch(error) {
        console.log(error);
        res.status(500).json({message :"Failed to send OTP"});
    }

};

//verify otp and create user
export const verifyOTPAndCreateUser =async(req,res)=>{
    const{email,otp}=req.body;
    try{ 
        const otpRecord=await otpDB.findOne({email});
        if(!otpRecord || otpRecord.otp !==otp.toString().trim()){

}

      const {formData}=otpRecord;
      const hashedPassword=await bcrypt.hash(formData.password,10)
      const newUser=new userDB({
        firstName:formData.firstName,
        lastName:formData.lastName,
        email : email,
        phone : formData.phone,
        password : hashedPassword,
        isActive : true
      });
      await newUser.save();
     
      await otpDB.deleteOne({_id : otpRecord._id});
      res.status(201).json({message:"User created successfully"});
  }
  catch(error){
    console.log(error);
    res.status(500).json({message :  "Failed to verify the OTP and create user"});

  }
};

//Resend otp
 export const resendOTP=async(req,res)=>{
    const{email,formData}=req.body;
    try{
        if(!email){
            return res.status(400).json({message:"Email is required"});
        }
      
        const newOtp=generateOTP();
        console.log(newOtp);

      
      const otpRecord = await otpDB.findOne({ email });
      if(otpRecord){
        await otpDB.updateOne({email},{$set:{otp:newOtp,formData}});

      }else{
        const newOTP=new otpDB({email,otp:newOtp,formData});
        await newOTP.save();
      }
      await otpSender(email,newOtp);
      return res.status(200).json({message :"OTP Resent successfully"});
    }catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to resend OTP" });
    }
 };

 //verify Login
 export const verifyLogin =async (req,res)=>{
    const {email,password}=req.body;
 
 try{
    const userExist=await userDB.findOne({email});
    if(!userExist) return res.status(404).json({message :`User doesn't exist !`});
    if(userExist.isBlocked) return res.status(403).json({message:"you are blocked. please contact Admin"});
    const isPasswordCorrect =await bcrypt.compare(password,userExist.password);
    if(!isPasswordCorrect) return res.status(401).json({message :"Email or Password is wrong"});
    generateUserAccessToken(res,userExist);
    generateUserRefreshToken(res,userExist);

    const userName=userExist.firstName;
    return res.status(200).json({message:"Logged in successfully",userName});

 }
 catch(error){
    return res.status(500).json({message :"Something went wrong.please try again"});
 }
}

//logout
export  const logout=async(req,res)=>{
  try{
    res 
    .clearCookie('userAccessToken')
    .clearCookie('userRefreshToken')
    .status(200).json({message :"User logged out successfully"});
  }catch(error){
    return res.status(500).json({message :"Something went wrong !Please try again"});
}
}


//Google authentication
export const googleAuth=async(req,res)=>{
  const {name,email}=req.body
  try{
    const userExists=await userDB.findOne({email});
    if(userExists){
      generateUserAccessToken(res,userExists);
      generateUserRefreshToken(res,userExists)
      return res.status(200).json({success:true,message:"user logged in successfully"})
  
    }else{
      const [firstName, ...lastNameArray] = name.split(" ");
      const lastName = lastNameArray.join(" ") || "Doe"; 

      const newUser = new userDB({
        firstName,
        lastName,
        email,
        phone:generateUniquePhoneNumber(),
        password :generateRandomPassword(),
        role : "user",
        isBlocked : false,
      })
      const newUserDetail = await newUser.save()
      generateUserAccessToken(res,newUserDetail)
      generateUserRefreshToken(res,newUserDetail)
      res.status(200).json({success:true,message:"account created and logged in successfully"})
    }
  }
  catch(error){
    console.log("error during google aunthentication",error);
      return res.status(500).json({message : "Internal server error.Please try again"})
  }
}

 const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8); g
  };
  
  //generate phone number
  const generateUniquePhoneNumber = () => {
      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000); 
      return randomNumber; 
  };
    //
    //Forgot verify email
export const forgotVerifyEmail = async (req,res) => {

  const {email} = req.body;
 
  if(!email) return res.status(400).json({message : "Email is required"});

  try{
      const user = await userDB.findOne({email});

      if(!user){
          return res.status(400).json({message : "User not found.Please check your email"})
      }

      await otpDB.deleteOne({email});

      const otp = generateOTP();
      console.log(otp)

      const newOTP = new otpDB({
          email,
          otp
      });

      await newOTP.save();
      
      await otpSender (email,otp,"forgot-password");

      return res.status(200).json({message :"OTP sent successfull"})
      
  }
  catch(error){
    console.log("error:",error)
      return res.status(500).json({message :"something went wrong . Try again later"})
  }
};

//verify the forgot otp
export const forgotVerifyOtp = async (req,res) =>{
  const {email, otp} = req.body;

  console.log(req.body);

  if(!email || !otp){
      return res.status(400).json({message :"Email and OTP are requird"});
  }

  try{
      const storedOTP = await otpDB.findOne({email});

      if(!storedOTP){
          return res.status(400).json({message :"No OTP found for this email"});
      }

      if (storedOTP.expiresAt < new Date()) {
          await otpDB.deleteOne({ email });
          return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }

      if(storedOTP.otp !== otp.join('')){
          return res.status(400).json({message : "Invalid OTP !"})
      }

      await otpDB.deleteOne({email});

      return res.status(200).json({message :"OTP verified successfully"})
  }
  catch(error){
      return res.status(500).json({message :"something went wrong ! please try again later"})
  }
}


//update the password
export const forgotChangePassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required." });
  }

  try {
      
      const otpRecord = await otpDB.findOne({ email });

      const hashedPassword = await bcrypt.hash(newPassword, 10);


      const updatedPassword = await userDB.updateOne(
          { email },
          { $set: { password: hashedPassword } }
      );



      if (!updatedPassword.matchedCount) {
          return res.status(404).json({ message: "User not found" });
      }

      if (!updatedPassword.modifiedCount) {
          return res.status(400).json({ message: "No changes made" });
      }

      if (otpRecord) {
          await otpDB.deleteOne({ _id: otpRecord._id });
      }

      return res.status(200).json({ message: "Password changed successfully" });

  } catch (error) {
    
      return res.status(500).json({ message: "Something went wrong. Please try again later" });
  }
};