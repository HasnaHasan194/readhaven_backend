
import userDB from "../../Models/userSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";
//fetch user details
export const getUsers =async(req,res)=>{
   try{
    const page=parseInt(req.query.page) || 1;
    const limit =parseInt(req.query.limit) || 5;
    const skip=(page -1)*limit;
    const totalUsers =await userDB.countDocuments({role:"user"});
    const users=await userDB.find({role :"user"}).sort({createdAt:-1}).skip(skip).limit(limit);

    return res.status(STATUS_CODES.SUCCESS).json({
        message :"customers fetched successfully",
        users,
        totalUsers,
        totalPages:Math.ceil(totalUsers/limit),
        currentPage:page,
    });
   }
   catch(error){
    console.log(error)
    return res.status(STATUS_CODES.SERVER_ERROR).json({message :"Something went wrong! please try again later"});
   }
}

//block or unblock users
export const blockUser=async(req,res)=>{
    try{
        const userId=req.params.id;
        const user=await userDB.findById(userId);
        if(!user){
            return res.send(STATUS_CODES.NOT_FOUND).json({message:"User not found"});
}
   user.isBlocked=!user.isBlocked;
    await user.save();
    res.status(STATUS_CODES.SUCCESS).json({message : `User has been ${user.isBlocked ? "blocked" : "unblocked"}`});

}
catch(error){
    res.status(STATUS_CODES.SERVER_ERROR).json({message : "Something went wrong", error : error.message});
}

    }
