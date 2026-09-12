import { errorHandler } from "../../Middlewares/error.js";
import CouponDB from "../../Models/couponSchema.js";
import orderDB from "../../Models/orderSchema.js";
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
        
        if(discountType === "percentage" && (discountValue > 85 || discountValue <=0)){
            return next(errorHandler(STATUS_CODES.CONFLICT,"Discount value must be greater than 0 and less than 85%"))
        }    

        if(discountType === "amount" && (discountValue >= minimumPurchase || discountValue<=0)){
            return next(errorHandler(STATUS_CODES.CONFLICT,"Discount value must be greater than 0 and  less than minimum purchase"))
        }
            
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

// to block or unblock the coupon
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

// to fetch single coupon by id
export const getCouponById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coupon = await CouponDB.findById(id);
        if (!coupon) {
            return next(errorHandler(STATUS_CODES.NOT_FOUND, "Coupon not found"));
        }
        return res.status(STATUS_CODES.SUCCESS).json({
            message: "Coupon fetched successfully",
            coupon,
        });
    } catch (error) {
        console.log("Error fetching coupon", error);
        return next(errorHandler(STATUS_CODES.SERVER_ERROR, "Something went wrong"));
    }
};

// to edit coupon
export const editCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { code, discountType, discountValue, minimumPurchase, expiryDate, description } = req.body;

        if (!id) {
            return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Coupon ID is required"));
        }

        const existingCoupon = await CouponDB.findById(id);
        if (!existingCoupon) {
            return next(errorHandler(STATUS_CODES.NOT_FOUND, "Coupon not found"));
        }

        // Expiry check: block editing if expiry date has passed
        const now = new Date();
        const currentExpiry = new Date(existingCoupon.expiryDate);
        if (currentExpiry < now) {
            return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Expired coupons cannot be edited"));
        }

        if (!code || !discountType || discountValue == null || !minimumPurchase || !expiryDate || !description) {
            return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Missing required fields"));
        }

        // Check if code exists on another coupon
        const duplicateCoupon = await CouponDB.findOne({ code, _id: { $ne: id } });
        if (duplicateCoupon) {
            return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Coupon code already exists! Try another one"));
        }

        if (discountType === "percentage" && (discountValue > 85 || discountValue <= 0)) {
            return next(errorHandler(STATUS_CODES.CONFLICT, "Discount value must be greater than 0 and less than 85%"));
        }

        if (discountType === "amount" && (discountValue >= minimumPurchase || discountValue <= 0)) {
            return next(errorHandler(STATUS_CODES.CONFLICT, "Discount value must be greater than 0 and less than minimum purchase"));
        }

        existingCoupon.code = code;
        existingCoupon.discountType = discountType;
        existingCoupon.discountValue = discountValue;
        existingCoupon.minimumPurchase = minimumPurchase || 0;
        existingCoupon.expiryDate = expiryDate;
        existingCoupon.description = description;

        await existingCoupon.save();

        return res.status(STATUS_CODES.SUCCESS).json({
            message: "Coupon updated successfully",
            coupon: existingCoupon,
        });
    } catch (error) {
        console.log("Error updating coupon", error);
        return next(errorHandler(STATUS_CODES.SERVER_ERROR, "Something went wrong"));
    }
};
