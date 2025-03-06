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
    
  },
  { timestamps: true } 
);

const CategoryDB = mongoose.model("Category", categorySchema);

export default CategoryDB;
