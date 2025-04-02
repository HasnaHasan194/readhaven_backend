import wishListDB from "../../Models/wishListSchema.js";
import ProductDB from "../../Models/productSchema.js";
import { refreshTokenDecoder } from "../../utils/jwtTokens/decodeRefreshToken.js";
import { errorHandler } from "../../Middlewares/error.js";
import { STATUS_CODES } from "../../utils/constants.js";

//to add product to wishlist
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    console.log(req.body)
    const userId = refreshTokenDecoder(req);
    if (!productId) {
      return next(errorHandler(STATUS_CODES.BAD_REQUEST, "productId is required"));
    }
    const product = await ProductDB.findById(productId);
    if (!product) return next(errorHandler(STATUS_CODES.NOT_FOUND, "product not found"));

    //check if wishlist exists
    let wishlist = await wishListDB.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new wishListDB({ user: userId, products: [{ productId }] });
    } else {
      const exists = wishlist.products.some(
        (item) => item.productId.toString() === productId
      );
      if (exists)
        return next(errorHandler(STATUS_CODES.BAD_REQUEST, "product is already in the wishlist"));
      wishlist.products.push({ productId });
    }
    await wishlist.save();
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "product added to wishlist", wishlist });
  } catch (error) {
    console.log(error)
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong !please try again"));
  }
};

//to remove product from the wishlist
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = refreshTokenDecoder(req);

    const wishlist = await wishListDB.findOne({ user: userId });
    if (!wishListDB) return next(errorHandler(STATUS_CODES.NOT_FOUND, "wishlist not found"));

    wishlist.products = wishlist.products.filter(
      (item) => item.productId.toString() !== productId
    );

    await wishlist.save();
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Product removed from wishlist", wishlist });
  } catch (error) {
    console.log(error)
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong!Please try again"));
  }
};

//to get the user wish list
export const getWishlist = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);
    if (!userId) return next(errorHandler(STATUS_CODES.NOT_FOUND, "user not found"));

    const wishlist = await wishListDB
      .findOne({ user: userId })
      .sort({ createdAt: -1 })
      .populate("products.productId");

    if (!wishlist) return next(errorHandler(STATUS_CODES.NOT_FOUND, "wishlist is empty"));

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "wishlist fetched successfully", wishlist });
  } catch (error) {
    console.log(error)
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong!please try again"));
  }
};
