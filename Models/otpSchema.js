import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    formData:{
        type:Object
    },
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60, 
    }
});


const OtpModel = mongoose.model("Otp", otpSchema);

export default OtpModel;
