
import userDB from "../../Models/userSchema.js";
//fetch user details
export const getUsers =async(req,res)=>{
   try{
    const page=parseInt(req.query.page) || 1;
    const limit =parseInt(req.query.limit) || 5;
    const skip=(page -1)*limit;
    const totalUsers =await userDB.countDocuments({role:"user"});
    const users=await userDB.find({role :"user"}).sort({createdAt:-1}).skip(skip).limit(limit);

    return res.status(200).json({
        message :"customers fetched successfully",
        users,
        totalUsers,
        totalPages:Math.ceil(totalUsers/limit),
        currentPage:page,
    });
   }
   catch(error){
    return res.status(500).json({message :"Something went wrong! please try again later"});
   }
}

//block or unblock users
export const blockUser=async(req,res)=>{
    try{
        const userId=req.params.id;
        const user=await userDB.findById(userId);
        if(!user){
            return res.send(404).json({message:"User not found"});
}
   user.isBlocked=!user.isBlocked;
    await user.save();
    res.status(200).json({message : `User has been ${user.isBlocked ? "blocked" : "unblocked"}`});

}
catch(error){
    res.status(500).json({message : "Something went wrong", error : error.message});
}

    }
