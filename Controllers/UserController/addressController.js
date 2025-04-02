import addressDB from "../../Models/addressSchema.js";
import { refreshTokenDecoder } from "../../utils/jwtTokens/decodeRefreshToken.js";

import { errorHandler } from "../../Middlewares/error.js";
import { STATUS_CODES } from "../../utils/constants.js";

//to add address
export const addAddress = async (req,res,next)=>{
    const formData =req.body;
   const id=refreshTokenDecoder(req);
     try{
       await addressDB.create({...formData,userId :id}) ;
       return res.status(STATUS_CODES.SUCCESS).json({message :"new address added successfully"})
     }catch(error){
        console.log(error)
        return next(errorHandler(STATUS_CODES. SERVER_ERROR,"something went wrong when adding new address"))
    }
     }

//edit address

export const editAddress = async (req,res,next)=>{
    const addressId = req.params.id;
    const formData = req.body;
    try{
        const updateAddress =await addressDB.updateOne({id :addressId},{$set: formData});
        if(updateAddress.modifiedCount ===0) return res.status(STATUS_CODES.BAD_REQUEST).json({message :"No changes were made"});
        return res.status(STATUS_CODES.SUCCESS).json({message:"address update successfully"})
}
catch(error){
    console.log(error)
    return next(errorHandler(STATUS_CODES. SERVER_ERROR,"something went wrong please try again"))
}
}
//to get all addresses
export const getAddresses = async (req, res, next) => {
    try{
    const id = refreshTokenDecoder(req);
    const addresses = await addressDB.find({userId : id});
    if(!addresses){
        return next(errorHandler(STATUS_CODES.NOT_FOUND,"addresses not found"));
    }
    return res.status(STATUS_CODES.SUCCESS).json({message : "addresses fetched successfully",addresses})
  }
  catch(error){
    console.log(error)
    return next(errorHandler(STATUS_CODES. SERVER_ERROR,"something went wrong please try again"))
  }
}

// to get a specific address
export const getAddress = async (req, res, next) =>{
    try{
        const addressId = req.params.id;
        
        const address = await addressDB.findOne({_id : addressId});

        if(!address) {
            return next(errorHandler(STATUS_CODES.NOT_FOUND,"addrress not fouund"))
        }

        return res.status(STATUS_CODES.SUCCESS).json({message : "address fetched successfully",address});
    }
    catch(error){
        console.log(error)
        return next(errorHandler(STATUS_CODES. SERVER_ERROR,"something went wrong!please try again"));
    }
}
//to delete address
export const deleteAddress = async (req, res, next) =>{
    const addressId = req.params.id;
    try{
        const address = await addressDB.findOne({_id : addressId});

        if(address.isDefault) return next(errorHandler(STATUS_CODES.BAD_REQUEST,"You cannot delete the default address"));
        
        const deleteAddress = await addressDB.deleteOne({_id : addressId});
        if(deleteAddress.deletedCount ===0 ) return next(errorHandler(STATUS_CODES.NOT_FOUND,"Address not found or already deleted"))

        return res.status(STATUS_CODES.SUCCESS).json({message : "address deleted successfully"})    

    }
    catch(error){
        console.log(error)
        return next(errorHandler(STATUS_CODES. SERVER_ERROR,"something went wrong!please try again"))
    }
}

//to set the address as default
export const setDefaultAddress = async (req, res, next) =>{
    const addressId = req.params.id;
    try{
        //address to be set as default
        const targetAddress = await addressDB.findById(addressId);
        if(!targetAddress) return next(errorHandler(STATUS_CODES.NOT_FOUND,"Address not found"));

        await addressDB.updateMany({userId : targetAddress.userId}, {isDefault : false});

        await addressDB.updateOne({_id : addressId},{isDefault : true});

        return res.status(STATUS_CODES.SUCCESS).json({message : "Address set as default"})    
    }
    catch(error){
        console.log(error)
        return next(errorHandler(STATUS_CODES. SERVER_ERROR,"something went wrong!Please try again"))
    }
}
     
