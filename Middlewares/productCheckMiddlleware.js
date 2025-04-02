import cartDB from "../Models/cartSchema.js";
import { refreshTokenDecoder } from "../utils/jwtTokens/decodeRefreshToken.js";
import { errorHandler } from "./error.js";
// import ProductDB from "../Models/productSchema.js";
import { STATUS_CODES } from "../utils/constants.js";

export const validateProduct = async (req, res, next) => {
    try {
        const userId = refreshTokenDecoder(req);


        // Finding the cart of the user
        const cart = await cartDB.findOne({ userId }).populate({
            path: 'items.product',
            populate: { path: 'Category', select: 'name -_id' }
        });


        if (!cart) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Cart not found"));
        if (cart.items.length === 0) return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Cart is empty"));

        let items = cart.items;

        for (const item of items) {
            // Check if the product is blocked
            if (item?.product?.isBlocked) {
                return next(errorHandler(STATUS_CODES.BAD_REQUEST, `The product "${item.product.name}" is unavailable or blocked`));
            }

            // Check if the quantity exceeds available stock
            if (item.quantity > item.product.availableQuantity) {
                return next(errorHandler(STATUS_CODES.BAD_REQUEST, `Insufficient stock for product "${item.product.name}"`));
            }
        }

        req.userId = userId;

        // Map the cart items to a format suitable for further processing
        req.cartItems = items.map((item) => ({
            product: item.product._id,
            productPrice: item.price,
            quantity: item.quantity
        }));


        next();
    } catch (error) {
        console.log(error)
        return next(errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong during product checking"));
    }
};
