import { errorHandler } from "../../Middlewares/error.js";
import CouponDB from "../../Models/couponSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";

//to get coupons
export const getCoupons = async (req,res,next)=>{
    try{
        const currentDate =new Date();
        const coupons =await CouponDB.find({
          isActive :true,
          expiryDate :{$gte :currentDate},
        });
        res.status(STATUS_CODES.SUCCESS).json({message :"Coupons fetched successfully",coupons});
    }catch(error){
        console.log(error)
        return next(errorHandler(STATUS_CODES. SERVER_ERROR,"Something went wrong "));
    }
}
