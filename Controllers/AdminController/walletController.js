import walletDB from "../../Models/walletSchema.js";
import { errorHandler } from '../../Middlewares/error.js';
import { STATUS_CODES } from "../../utils/constants.js";

//to get the transcations
export const getWalletTransactions = async(req, res, next) => {
    try{
        const walletTransactions = await walletDB.aggregate([
            {
                $lookup : {
                    from : "users",
                    localField : "userId",
                    foreignField : "_id",
                    as : "userDetails"
                }
            },
            {$unwind : "$transactions"},
            { $unwind: "$userDetails" },
            {
                
                $project :{
                    _id : 0,
                    transactionId : "$transactions._id",
                    description : "$transactions.description",
                    transactionData : "$transactions.transactionDate",
                    user : "$userDetails.firstName",
                    transactionType : "$transactions.transactionType",
                    amount : "$transactions.amount"
                }
            }
            
        ]);
        return res.status(STATUS_CODES.SUCCESS).json({walletTransactions})
    }
    catch(error){
        console.log(error)
        return next(errorHandler(STATUS_CODES. SERVER_ERROR,"something went wrong"));
    }
}

