import mongoose from "mongoose";
const cartSchema =new mongoose.Schema({
    userId:{
        type:mongoose.Schema.ObjectId,
        required : true
    },
    items : [   
        {
            product : {
                type : mongoose.Schema.ObjectId,
                ref : "Product",
                required : true,
            },
            
            quantity : {
                type : Number
            },
            price : {
                type : Number
            }
        }
    ]
    });
    
    cartSchema.virtual("totalPrice").get(function(){
        return this.items.reduce((acc,item) => acc + item.price * item.quantity,0);
    });
    
    const cartDB = mongoose.model('cart',cartSchema);
    export default cartDB;


  
