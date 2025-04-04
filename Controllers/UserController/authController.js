import dotenv from "dotenv";
dotenv.config();

import userDB from "../../Models/userSchema.js";
import otpDB from "../../Models/otpSchema.js";

import { otpSender } from "../../utils/otpSender.js";
import { generateOTP } from "../../utils/jwtTokens/generateOtp.js";

import bcrypt from "bcrypt";
import { generateUserAccessToken } from "../../utils/jwtTokens/accessToken.js";
import { generateUserRefreshToken } from "../../utils/jwtTokens/refreshToken.js";
import generateReferralCode from "../../utils/generateReferralCode.js";
import walletDB from "../../Models/walletSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";

export const generateAndSendOTP = async (req, res, next) => {
  let { email,  phone } =
    req.body;

  if (!email) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Email is required" });
  }

  try {
    const userExist = await userDB.findOne({ email });
    if (userExist)
      return res
        .status(STATUS_CODES. CONFLICT)
        .json({ message: "Email already exist.Please use a different Email" });

    const phoneExist = await userDB.findOne({ phone });
    if (phoneExist)
      return res.status(STATUS_CODES. CONFLICT).json({
        message:
          "Phone Number already existed . Please use a different Phone Number",
      });

    await otpDB.deleteOne({ email });

    const otp = generateOTP();

    console.log(otp);

    const newOTP = new otpDB({ email, otp, formData: req.body });
    await newOTP.save();

    await otpSender(email, otp, res, next);

    res.status(STATUS_CODES.SUCCESS).json({ message: "OTP send successfully", email });
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES. SERVER_ERROR).json({ message: "Failed to send OTP" });
  }
};

export const generateAndSendOTPToNewEmail = async (req, res) => {
  let { email } = req.body;

  if (!email) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Email is required" });
  }

  try {
    const userExist = await userDB.findOne({ email });
    if (userExist)
      return res
        .status(STATUS_CODES. CONFLICT)
        .json({ message: "Email already exist.Please use a different Email" });

    await otpDB.deleteOne({ email });

    const otp = generateOTP();

    console.log(otp);

    const newOTP = new otpDB({ email, otp, formData: req.body });
    await newOTP.save();

    await otpSender(email, otp, res);

    res.status(STATUS_CODES.SUCCESS).json({ message: "OTP send successfully", email });
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES. SERVER_ERROR).json({ message: "Failed to send OTP" });
  }
};

//verify otp and create user

export const verifyOTPAndCreateUser = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find the OTP record for the given email
    const otpRecord = await otpDB.findOne({ email });

    if (!otpRecord || otpRecord.otp !== otp.toString().trim()) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid OTP" }); // Return error for invalid OTP
    }

    // If OTP is valid, proceed with user creation
    const { formData } = otpRecord;
    const hashedPassword = await bcrypt.hash(formData.password, 10);
    const referralCode = generateReferralCode(formData.firstName,formData.lastName);
    let referredBy = null;
    if(formData.referredBy){
      const referrer = await userDB.findOne({referralCode : formData.referredBy})
      if(referrer){
        referredBy = referrer._id;

        const referrerWallet = await walletDB.findOne({userId : referredBy._id});
        if(referrerWallet){
            referrerWallet.balance+=100;
            referrerWallet.transactions.push({
                amount:100,
                transactionDate: new Date(),
                transactionType : "Credit",
                transactionStatus : "Success",
                description : `Referral bonus for referring ${formData.firstName}`,
            });
            await referrerWallet.save();
        }
    }
  }

    

    const newUser = new userDB({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: email,
      phone: formData.phone,
      password: hashedPassword,
      isActive: true,
      referralCode,
      referredBy,
    });

    await newUser.save(); 

    //create the wallet for the user
    await walletDB.create({
      userId: newUser._id,
      balance: 0,
      transactions: [],
    });
    if(formData.referredBy){
      const refereeWallet = await walletDB.findOne({userId : newUser._id});
      if(refereeWallet){
          refereeWallet.balance+=50;
          refereeWallet.transactions.push({
              amount: 50,
              transactionDate: new Date(),
              transactionType: "Credit",
              transactionStatus: "Success",
              description: "Signup bonus for using a referral code"
          });
          await refereeWallet.save();
      }
  }

  //delete otp record after successfull verification
    await otpDB.deleteOne({ _id: otpRecord._id });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(STATUS_CODES. SERVER_ERROR)
      .json({ message: "Failed to verify the OTP and create user" });
  }
};

export const verifyTheOTPForNewEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find the OTP record for the given email
    const otpRecord = await otpDB.findOne({ email });

    
    if (!otpRecord || otpRecord.otp !== otp.toString().trim()) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid OTP" }); 
    }
    await otpDB.deleteOne({ _id: otpRecord._id });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(STATUS_CODES. SERVER_ERROR)
      .json({ message: "Failed to verify the OTP and create user" });
  }
};

//Resend otp
export const resendOTP = async (req, res, next) => {
  const { email, formData } = req.body;
  try {
    if (!email) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Email is required" });
    }

    const newOtp = generateOTP();
    console.log(newOtp);

    const otpRecord = await otpDB.findOne({ email });
    if (otpRecord) {
      await otpDB.updateOne({ email }, { $set: { otp: newOtp, formData } });
    } else {
      const newOTP = new otpDB({ email, otp: newOtp, formData });
      await newOTP.save();
    }
    await otpSender(email, newOtp, res, next);
    return res.status(STATUS_CODES.SUCCESS).json({ message: "OTP Resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES. SERVER_ERROR).json({ message: "Failed to resend OTP" });
  }
};

//verify Login
export const verifyLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExist = await userDB.findOne({ email });
    if (!userExist)
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: `User doesn't exist !` });
    if (userExist.isBlocked)
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "you are blocked. please contact Admin" });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      userExist.password
    );
    if (!isPasswordCorrect)
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: "Email or Password is wrong" });
    generateUserAccessToken(res, userExist);
    generateUserRefreshToken(res, userExist);

    const userName = userExist.firstName;
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Logged in successfully", userName });
  } catch (error) {
    console.log(error)
    return res
      .status(STATUS_CODES. SERVER_ERROR)
      .json({ message: "Something went wrong.please try again" });
  }
};

//logout
export const logout = async (req, res) => {
  try {
    res
      .clearCookie("userAccessToken")
      .clearCookie("userRefreshToken")
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "User logged out successfully" });
  } catch (error) {
    console.log(error)
    return res
      .status(STATUS_CODES. SERVER_ERROR)
      .json({ message: "Something went wrong !Please try again" });
  }
};

//Google authentication
export const googleAuth = async (req, res) => {
  const { name, email } = req.body;
  try {
    const userExists = await userDB.findOne({ email });
    if (userExists) {
      generateUserAccessToken(res, userExists);
      generateUserRefreshToken(res, userExists);
      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ success: true, message: "user logged in successfully" });
    } else {
      const [firstName, ...lastNameArray] = name.split(" ");
      const lastName = lastNameArray.join(" ") || "Doe";
      const referralCode = generateReferralCode(firstName,lastName)

      const newUser = new userDB({
        firstName,
        lastName,
        email,
        phone: generateUniquePhoneNumber(),
        password: generateRandomPassword(),
        referralCode,
        role: "user",
        isBlocked: false,
      });
      const newUserDetail = await newUser.save();
      await walletDB.create({
        userId: newUser._id,
        balance: 0,
        transactions: [],
      });
      generateUserAccessToken(res, newUserDetail);
      generateUserRefreshToken(res, newUserDetail);
      res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        message: "account created and logged in successfully",
      });
    }
  } catch (error) {
    console.log("error during google aunthentication", error);
    return res
      .status(STATUS_CODES. SERVER_ERROR)
      .json({ message: "Internal server error.Please try again" });
  }
};

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8);
  
};

//generate phone number
const generateUniquePhoneNumber = () => {
  const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
  return randomNumber;
};
//forgot verify email
export const forgotVerifyEmail = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Email is required" });
  }

  try {
    const user = await userDB.findOne({ email });

    if (!user) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "User not found. Please check your email" });
    }

    await otpDB.deleteOne({ email });

    const otp = generateOTP();
    console.log(otp);

    const newOTP = new otpDB({
      email,
      otp,
    });

    await newOTP.save();

    await otpSender(email, otp, res, next);

    return res.status(STATUS_CODES.SUCCESS).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log("error:", error);
    return res
      .status(STATUS_CODES. SERVER_ERROR)
      .json({ message: "Something went wrong. Try again later" });
  }
};

//verify the forgot otp
export const forgotVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  console.log(req.body);

  if (!email || !otp) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Email and OTP are requird" });
  }

  try {
    const storedOTP = await otpDB.findOne({ email });

    if (!storedOTP) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "No OTP found for this email" });
    }

    if (storedOTP.expiresAt < new Date()) {
      await otpDB.deleteOne({ email });
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    if (storedOTP.otp !== otp.join("")) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid OTP !" });
    }

    await otpDB.deleteOne({ email });

    return res.status(STATUS_CODES.SUCCESS).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.log(error)
    return res
      .status(STATUS_CODES. SERVER_ERROR)
      .json({ message: "something went wrong ! please try again later" });
  }
};

//update the password
export const forgotChangePassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ message: "Email and new password are required." });
  }

  try {
    const otpRecord = await otpDB.findOne({ email });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedPassword = await userDB.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    if (!updatedPassword.matchedCount) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }

    if (!updatedPassword.modifiedCount) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "No changes made" });
    }

    if (otpRecord) {
      await otpDB.deleteOne({ _id: otpRecord._id });
    }

    return res.status(STATUS_CODES.SUCCESS).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error)
    return res
      .status(STATUS_CODES. SERVER_ERROR)
      .json({ message: "Something went wrong. Please try again later" });
  }
};
