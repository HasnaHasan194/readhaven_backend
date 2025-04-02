import mongoose from "mongoose";
const addressSchema = new mongoose.Schema({
    fullname : {
        type : String,
        required : true
    },
    email : {
        type : String
    },
    buildingname : {
        type : String,
    },
    address : {
        type : String,
        required : true
    },
    district : {
        type : String,
        required : true
    },
    state : {
        type : String,
        required : true
    },
    city : {
        type : String,
        required : true
    },
    pincode : {
        type : String,
        required : true
    },
    landmark : {
        type : String,
        required : true
    },
    userId : {
        type : mongoose.Schema.ObjectId,
        ref : "user",
        required : true
    },
    isDefault : {
        type : Boolean,
        default : false
    }
});
const addressDB =mongoose.model("addresses",addressSchema);
export default addressDB;