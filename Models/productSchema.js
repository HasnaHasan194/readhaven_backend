import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim:true
    },
    publishedDate: {
        type: Date,
        required: false,
        trim:true,
    },
    writer: {
        type: String,
        required: false,

    },
    Category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    language: {
        type: String,
        enum: ['English', 'Malayalam', 'Hindi', 'Tamil'],
        required: false,
    },
    regularPrice: {
        type: Number,
        required: true,
    },
    salePrice: {
        type: Number,
        default: 0,
    },
    productOffer: {
        type: Number, 
        default: 0
    },
    description: {
        type: String,
        required: true,
    },
    availableQuantity: {
        type: Number,
        default: 0,
    },
    productImages: {
        type: [String],
        required: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['Available', 'Out of Stock', 'Discontinued'],
        default: 'Available',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    
rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
}

    
});

const ProductDB = mongoose.model('Product', productSchema);
export default ProductDB;