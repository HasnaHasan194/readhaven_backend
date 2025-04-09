//UserDB
import userDB from "../../Models/userSchema.js";
import bcrypt from "bcrypt"

//access tokens and refresh token generators
import { generateAdminAccessToken } from "../../utils/jwtTokens/accessToken.js";
import { generateAdminRefreshToken } from "../../utils/jwtTokens/refreshToken.js";
import { STATUS_CODES } from "../../utils/constants.js";

export const verifyLogin=async (req,res)=>{
    try{
        const{email,password}=req.body;
        const adminExist =await userDB.findOne({email,role :"admin"});
        if(!adminExist){
            return res.status(STATUS_CODES.NOT_FOUND).json({message : "Email doesnt exist!!"})
        }
     const isPasswordCorrect=await bcrypt.compare(password,adminExist.password);

     if(!isPasswordCorrect){
        return res.status(STATUS_CODES.UNAUTHORIZED).json({message : "Invalid credentials!"});
    }
    generateAdminAccessToken(res,adminExist);
    generateAdminRefreshToken(res,adminExist);
    const adminName=adminExist.firstName;
    return res.status(STATUS_CODES.SUCCESS).json({message :"Logged in successfully",adminName})
 }
 catch(error){
    console.log(error)
    return res.status(STATUS_CODES.SERVER_ERROR).json({message : "something went wrong. Please try again!"})
}
}     
//logout function
export const logoutAdmin=(req,res)=>{
    res.clearCookie("adminAccessToken",{httpOnly : true ,secure: false,samSite:"Lax"});
    res.clearCookie("adminRefreshToken",{httpOnly : true,secure:false ,samSite:"Lax"});
    return res.status(STATUS_CODES.SUCCESS).json({message:"Logout successfully"})
} 
 
    
