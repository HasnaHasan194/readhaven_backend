import mongoose from "mongoose";
import CategoryDB from "./categorySchema.js";
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  publishedDate: {
    type: Date,
    required: false,
    trim: true,
  },
  writer: {
    type: String,
    required: false,
  },
  Category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  language: {
    type: String,
    enum: ["English", "Malayalam", "Hindi", "Tamil"],
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
    default: 0,
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
    enum: ["Available", "Out of Stock", "Discontinued"],
    default: "Available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to calculate the salePrice based on productOffer and categoryOffer
productSchema.pre("save", async function (next) {
  try {
    // Get the Category model
    mongoose.model("Category");

    // Get the category document to access its offer
    const categoryDoc = await CategoryDB.findById(this.Category);
    const categoryOffer = categoryDoc ? categoryDoc.offer : 0;

    // Get the product offer
    const productOffer = this.productOffer;

    let discount = 0;
    if (productOffer === 0 && categoryOffer === 0) {
      discount = 0;
    } else if (productOffer === 0) {
      discount = categoryOffer;
    } else if (categoryOffer === 0) {
      discount = productOffer;
    } else {
      discount = Math.max(productOffer, categoryOffer);
    }

    // Calculate the sale price
    if (this.regularPrice) {
      const computedSalePrice = Math.round(
        this.regularPrice - (this.regularPrice * discount) / 100
      );
      this.salePrice = Math.max(0, computedSalePrice);
    }

    next();
  } catch (error) {
    next(error);
  }
});

const ProductDB = mongoose.model("Product", productSchema);
export default ProductDB;
