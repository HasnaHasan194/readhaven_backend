import usersDB from "../Models/userSchema.js";

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
            return res.status(403).json({message :"you are blocked ! please contact admin"})
        }
        next()
    }
    catch(error){
        return res.status(500).json({message :"something went wrong! please try again"});
    }
}