import usersDB from "../Models/userSchema.js";
import { STATUS_CODES } from "../utils/constants.js";

export const verifyUserBlocked = async(req, res, next) =>{
    try{
        const userId = req.userId;

        if(!userId){
            return next()
        }

        const validUser = await usersDB.findOne({_id : userId});

        if(!validUser || validUser.isBlocked){
            res
            .clearCookie('userAccessToken')
            .clearCookie('userRefreshToken')
            return res.status(STATUS_CODES.FORBIDDEN).json({message :"you are blocked ! please contact admin"})
        }
        next()
    }
    catch(error){
        console.log(error)
        return res.status(STATUS_CODES. SERVER_ERROR).json({message :"something went wrong! please try again"});
       
    }
}