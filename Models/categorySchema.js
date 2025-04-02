import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique : true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    offer : {
      type : Number,
      default: 0,
      min: [0, "Offer cannot be negative"], 
    }   
  },
  { timestamps: true } 
);

const CategoryDB = mongoose.model("Category", categorySchema);

export default CategoryDB;
