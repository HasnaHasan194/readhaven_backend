
import { STATUS_CODES } from "../utils/constants";
export const verifyUser = async(req, res, next) =>{
    if(req.userRole !== "user"){
        return res.status(STATUS_CODES.FORBIDDEN).json({message : "Access denied !"});
    }
    next();
}