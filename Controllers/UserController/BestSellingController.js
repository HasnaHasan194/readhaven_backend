import ProductDB from "../../Models/productSchema.js";

// Controller function for Best Selling Products
export const getBestSellingProducts = async (req, res) => {
  try {
    
    const products = await ProductDB.find({
      status: "Available", 
      isBlocked: false,
    })
      .sort({ createdAt: -1 }) 
      .limit(6); 

  
    return res.status(200).json({
      success: true,
      message: "Best-selling products fetched successfully",
      products  
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch best-selling products",
      error: error.message,
    });
  }
};
