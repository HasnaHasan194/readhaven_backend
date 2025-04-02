import mongoose from "mongoose";
const walletSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : true,
    },
    balance : {
        type : Number,
        required : true,
        default : 0
    },
    transactions : [
        {
            description :{
                type : String,
            },
            transactionDate :{
                type : Date,
                required : true
            },
            transactionType :{
                type : String,
                enum : ["Debit","Credit"],
                required : true
            },
            transactionStatus :{
                type : String,
                enum :["Pending","Success","Failed"],
                required : true
            },
            amount : {
                type : Number,
                required : true
            }
        }
    ]

});
const walletDB =new mongoose.model('wallet',walletSchema);
export default walletDB;