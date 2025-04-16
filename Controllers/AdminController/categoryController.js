import { errorHandler } from "../../Middlewares/error.js";
import CategoryDB from "../../Models/categorySchema.js";
import ProductDB from "../../Models/productSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";
//fetch category
export const getCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const totalCategory = await CategoryDB.countDocuments();
    const categories = await CategoryDB.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return res.status(STATUS_CODES.SUCCESS).json({
      message: "categories fetched successfully",
      categories: categories,
      totalPages: Math.ceil(totalCategory / limit),
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "internal server error" });
  }
};

//function  to add category
export const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Name and description required" });
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: "Category name must contain only alphabets and spaces",
      });
    }

    const existingCategory = await CategoryDB.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existingCategory) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "category already exists" });
    }
    const newCategory = new CategoryDB({
      name,
      description,
    });

    await newCategory.save();
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Category Added successfully", category: newCategory });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(STATUS_CODES.CONFLICT)
        .json({ message: "Category already exists" });
    }
    console.log("error in adding category ", error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

//unlist or list the category
export const blockCategory = async (req, res) => {
  const categoryId = req.params.id;
  try {
    const category = await CategoryDB.findById(categoryId);
    if (!category) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: "Category not found" });
    }
    category.isActive = !category.isActive;
    await category.save();
    return res.status(STATUS_CODES.SUCCESS).json({
      message: `${category.name} has been ${category.isActive} ? "blocked" : "unblocked"`,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "internal server error.please try again" });
  }
};
//Edit category
export const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.params);
    const { name, description } = req.body;
    console.log(req.body);
    if (!name || !description) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Name and description are required " });
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: "Category name must contain only alphabets and spaces",
      });
    }
    const existingCategory = await CategoryDB.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res
        .status(STATUS_CODES.CONFLICT)
        .json({ message: "Category already exists." });
    }

    const updateCategory = await CategoryDB.findByIdAndUpdate(id, {
      name,
      description,
    });

    if (updateCategory) {
      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ message: "updated the category" });
    }
    if (!updateCategory) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "Category Not found" });
    }

    return res.status(STATUS_CODES.SUCCESS).json({
      message: "Category updated successfully",
      category: updateCategory,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "internal server error" });
  }
};

//add offer
export const addOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { offer } = req.body;
    console.log(id);
    console.log(offer);
    //validate the offer
    if (offer === null || isNaN(offer) || Number(offer) < 0) {
      return next(
        errorHandler(
          STATUS_CODES.BAD_REQUEST,
          "A valid, non-negative offer percentage is required"
        )
      );
    }

    const updateCategory = await CategoryDB.findOneAndUpdate(
      { _id: id },
      { offer: Number(offer) },
      { new: true }
    );

    await ProductDB.updateMany({ Category: id }, { updatedAt: Date.now() });

    return res.status(STATUS_CODES.SUCCESS).json({
      message: "Offer updated successfully",
      category: updateCategory,
    });
  } catch (error) {
    console.log("error updating offer", error);
    return next(
      errorHandler(STATUS_CODES.SERVER_ERROR, "Internal server error")
    );
  }
};
