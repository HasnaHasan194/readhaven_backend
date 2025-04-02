import mongoose from "mongoose";
const wishlistSchema =new mongoose.Schema(
    {
        user : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "user",
            required : true
        },
        products : [
            {
                productId : {
                    type : mongoose.Schema.Types.ObjectId,
                    ref : "Product",
                    required : true,
                },
            }
        ]

    },
    {timestamps : true}
);
const wishListDB = mongoose.model("Wishlist",wishlistSchema);
export default wishListDB;