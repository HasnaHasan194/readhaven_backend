import { errorHandler } from "../../Middlewares/error.js";
import walletDB from "../../Models/walletSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";
import { refreshTokenDecoder } from "../../utils/jwtTokens/decodeRefreshToken.js";

//to get wallet
export const getWalletData = async (req, res, next) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const wallet = await walletDB
      .findOne({ userId })
      .select("balance transactions")
      .lean();

    if (!wallet) {
      // Create new wallet if it doesn't exist
      const newWallet = new walletDB({ userId, balance: 0, transactions: [] });
      await newWallet.save();
      return res.status(STATUS_CODES.SUCCESS).json({
        balance: 0,
        transactions: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          from: 0,
          to: 0,
          total: 0,
        },
      });
    }

    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);

    // Get paginated transactions
    const paginatedTransactions = wallet.transactions
      .slice(skip, skip + limit)
      .map((transaction) => ({
        id: transaction._id,
        description: transaction.description,
        transactionDate: transaction.transactionDate,
        transactionType: transaction.transactionType,
        transactionStatus: transaction.transactionStatus,
        amount: transaction.amount,
      }));

    const response = {
      success: true,
      balance: wallet.balance,
      transactions: paginatedTransactions,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        from: skip + 1,
        to: Math.min(skip + limit, totalTransactions),
        total: totalTransactions,
      },
    };

    res.status(STATUS_CODES.SUCCESS).json(response);
  } catch (error) {
    console.log(error)
    return next(
      errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong while fetching wallet")
    );
  }
};
//to deduct the wallet amount
export const deductWalletAmount =async(req,res,next)=>{
  const {amount,description} =req.body;
  if(!amount || isNaN(amount) || amount<=0) return next(errorHandler(STATUS_CODES.BAD_REQUEST,"Please provide a valid positive amountd"));
 try{
  const userId =refreshTokenDecoder(req);
  const wallet =await walletDB.findOne({userId});
  if(!wallet) return next(errorHandler(STATUS_CODES.NOT_FOUND,"wallet not found"));
  if(wallet.balance<amount) return next(errorHandler(STATUS_CODES.BAD_REQUEST,"Insufficient wallet balance"));
  const transactionDetails ={
    description : description || `payment for order`,
    transactionDate :new Date(),
    transactionType : "Debit",
    transactionStatus : "Success",
    amount :amount,
  }



//update the wallet balance
const walletUpdate = await walletDB.updateOne(
  {userId},
  {
    $push :{transactions : transactionDetails},
    $inc :{balance :-amount},
  }
);
if(walletUpdate.modifiedCount === 0 && walletUpdate.upsertedCount ===0){
  return next(errorHandler(STATUS_CODES.NOT_FOUND,"Wallet update failed"));
  }
  return res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    message :"wallet amount deducted successfully"
  })

 }catch(error){
  console.log("Error deducting wallet amount",error);
  return next(errorHandler(STATUS_CODES. SERVER_ERROR,"Something went wrong while deducting wallet balance"));
 }

}
