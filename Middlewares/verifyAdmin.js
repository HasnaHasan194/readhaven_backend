import { STATUS_CODES } from "../utils/constants";

export const verifyAdmin= async(req,res,next)=>{
    if(req.userRole !=="admin"){
        return res.status(STATUS_CODES.FORBIDDEN).json({message:"Access denied. Admins only"})
    }
    next();
}