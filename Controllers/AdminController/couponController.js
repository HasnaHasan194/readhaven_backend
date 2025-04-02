import { errorHandler } from "../../Middlewares/error.js";
import CouponDB from "../../Models/couponSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";

//to fetch the coupons 
export const getCoupons = async(req,res,next)=>{
    try{
        const coupons=await CouponDB.find({});
        return res.status(STATUS_CODES.SUCCESS).json({message :"coupons fetched successfully ",coupons});

    }catch(error){
        console.log(error)
        return next(errorHandler(STATUS_CODES.SERVER_ERROR,"Something went wrong"));
    }
}

//to create coupon
export const createCoupon =async (req,res,next)=>{
    try{
        const {code,discountType,discountValue,minimumPurchase,expiryDate,description}=req.body ;
        if(!code || !discountType || discountValue == null || !minimumPurchase || !expiryDate || !description){
            return next(errorHandler(STATUS_CODES.BAD_REQUEST,"Missing required fields"));

        };
        const existCoupon =await CouponDB.findOne({code});
        if(existCoupon) return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Coupon already exist!Try generating another one"))
            const coupon =new CouponDB({
        code,
        discountType,
        discountValue,
        minimumPurchase : minimumPurchase || 0,
        expiryDate,
        description
    });
    await coupon.save();
    return res.status(STATUS_CODES.SUCCESS).json({
        message :"Coupon created successfully",
        coupon
    });
    }
    catch(error){
        console.log("Error creating coupon",error);
        return next(errorHandler(STATUS_CODES.SERVER_ERROR,"something went wrong"))
    }
};

//to block or unblock the coupon
export const blockCoupon = async (req, res, next) => {
    try{
        const {id} = req.params;
        if(!id) return next(errorHandler(STATUS_CODES.BAD_REQUEST,"coupon id is required"));

        const coupon = await CouponDB.findOne({_id : id});
        if(!coupon) return next(errorHandler(STATUS_CODES.NOT_FOUND,"No coupon found"));

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        return res.status(STATUS_CODES.SUCCESS).json({message :`Updated the status`});
    }
    catch(error){
        console.log(error)
        return next(errorHandler(STATUS_CODES.SERVER_ERROR,"Something went wrong"));
    }
}
