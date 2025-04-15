import CategoryDB from "../../Models/categorySchema.js";
import ProductDB from "../../Models/productSchema.js";
import mongoose from "mongoose";
import { STATUS_CODES } from "../../utils/constants.js";
//to fetch the products
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalProducts = await ProductDB.countDocuments();
    const products = await ProductDB.find()
      .sort({ createdAt: -1 })
      .populate("Category", "name")
      .skip(skip)
      .limit(limit);

    return res.status(STATUS_CODES.SUCCESS).json({
      message: "products fetched successfully",
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Something went wrong! please try again later" });
  }
};

// to add the products

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      publishedDate,
      writer,
      Category,
      language,
      regularPrice,
      productOffer,
      description,
      availableQuantity,
      productImages,
    } = req.body;

    const requiredFields = {
      name,
      publishedDate,
      writer,
      Category,
      language,
      regularPrice,
      description,
      availableQuantity,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value && value !== 0)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: "Required fields are missing.",
        missingFields,
      });
    }

    if (typeof regularPrice !== "number" || regularPrice < 0) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Regular price must be a non-negative number" });
    }

    if (
      typeof availableQuantity !== "number" ||
      availableQuantity < 0 ||
      !Number.isInteger(availableQuantity)
    ) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Available quantity must be a non-negative integer" });
    }

    if (
      productOffer !== undefined &&
      (typeof productOffer !== "number" || productOffer < 0)
    ) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Product offer must be a non-negative number" });
    }

    const isValidCategory = await CategoryDB.findById(Category);
    if (!isValidCategory) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Invalid category" });
    }

    const existingProduct = await ProductDB.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      Category,
    });

    if (existingProduct) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Product already exists" });
    }

    if (!productImages || !Array.isArray(productImages)) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Product images must be provided as an array" });
    }

    const newProduct = new ProductDB({
      name,
      publishedDate,
      writer,
      Category,
      language,
      regularPrice,
      productOffer,
      description,
      availableQuantity,
      productImages,
    });

    const savedProduct = await newProduct.save();
    // if(product.productOffer>70){
    //     await ProductDB.deleteMany({productOffer :{$lt:{50}}})
    // }

    return res.status(STATUS_CODES.SUCCESS).json({
      message: "Product added successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Error adding product", error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Internal server error", error: error.message });
  }
};
//get a particular product
export const getProductEdit = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductDB.findById(id).populate("Category", "name");

    if (!product) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "product not found" });
    }
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "product fetch successfully", product });
  } catch (error) {
    console.error("Error fetching the product", error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "internal server error" });
  }
};

//fetch the categories
export const getCategoryDropDown = async (req, res) => {
  try {
    const categories = await CategoryDB.find({ isActive: true });
    return res.status(STATUS_CODES.SUCCESS).json({
      message: "categories fetched successfully",
      categories: categories,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "internal server error" });
  }
};
//to edit the product
export const editProduct = async (req, res) => {
  try {
    let { id } = req.params;
    console.log(id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Invalid product ID" });
    }

    const {
      name,
      publishedDate,
      writer,
      Category,
      language,
      regularPrice,
      productOffer,
      description,
      availableQuantity,
      productImages,
    } = req.body;

    // Check if product exists
    const existingProduct = await ProductDB.findById(id);
    if (!existingProduct) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "Product not found" });
    }

    if (name) {
      const duplicateProduct = await ProductDB.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        Category,
        _id: { $ne: id },
      });
      if (duplicateProduct) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({
            message:
              "Another product with this name already exists in the same category",
          });
      }
    }

    if (Category) {
      const isValidCategory = await CategoryDB.findById(Category);
      if (!isValidCategory) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: "Invalid category" });
      }
    }

    if (
      regularPrice !== undefined &&
      (typeof regularPrice !== "number" || regularPrice < 0)
    ) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Regular price must be a non-negative number" });
    }

    if (
      availableQuantity !== undefined &&
      (typeof availableQuantity !== "number" ||
        availableQuantity < 0 ||
        !Number.isInteger(availableQuantity))
    ) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Available quantity must be a non-negative integer" });
    }

    if (
      productOffer !== undefined &&
      (typeof productOffer !== "number" || productOffer < 0)
    ) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Product offer must be a non-negative number" });
    }

    if (productImages && !Array.isArray(productImages)) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Product images must be an array" });
    }

    // Update product details
    const updatedProduct = await ProductDB.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          publishedDate,
          writer,
          Category,
          language,
          regularPrice,
          salePrice: regularPrice - (regularPrice * productOffer) / 100,
          productOffer,
          description,
          availableQuantity,
          productImages,
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(STATUS_CODES.SUCCESS).json({
      message: "Product updated successfully",

      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product", error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Internal server error", error: error.message });
  }
};

//block or unblock the product
export const blockProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductDB.findById(id);

    if (!product) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "Product not found" });
    }

    product.isBlocked = !product.isBlocked;

    await product.save();

    return res.status(STATUS_CODES.SUCCESS).json({ message: "status updated" });
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Internal server error . please try again" });
  }
};
