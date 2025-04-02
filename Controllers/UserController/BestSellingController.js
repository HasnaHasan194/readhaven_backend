import ProductDB from "../../Models/productSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";

// Controller function for Best Selling Products
export const getBestSellingProducts = async (req, res) => {
  try {
    
    const products = await ProductDB.find({
      status: "Available", 
      isBlocked: false,
    })
      .sort({ createdAt: -1 }) 
      .limit(6); 

  
    return res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Best-selling products fetched successfully",
      products  
    });
  } catch (error) {
    console.error(error);
    return res.status(STATUS_CODES. SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch best-selling products",
      error: error.message,
    });
  }
};
