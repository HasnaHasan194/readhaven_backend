import ProductDB from "../../Models/productSchema.js";
import cartDB from "../../Models/cartSchema.js";
import { refreshTokenDecoder } from "../../utils/jwtTokens/decodeRefreshToken.js";
import { errorHandler } from "../../Middlewares/error.js";
import wishListDB from "../../Models/wishListSchema.js";
import walletDB from "../../Models/walletSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";


// to add items to the cart
export const addToCart = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);
    const { productId } = req.body;
    if (!productId)
      return next(
        errorHandler(STATUS_CODES.BAD_REQUEST, "Product  is  required")
      );

    const product = await ProductDB.findById(productId);
    if (!product)
      return next(errorHandler(STATUS_CODES.NOT_FOUND, "product not found"));

  // if(product.productOffer ===0 && product.availableQuantity<10){
  //   product.isBlocked=!product.isBlocked
  // }
  // // await product.save()
  // const cart.items= cart.items.filter((i)=>i._id.toString() !== productId)
  // const wishlist =await wishListDB.findOne({user:userId})
  //  wishlist.products=wishlist.products.filter((i)=>i._id.toString()!==productId)
  //  await wishlist.save();
  
    //find the carts for the user or create a new one
   


    const remove=await cartDB.deleteOne({})
    let cart = await cartDB.findOne({ userId });
    if (!cart) {
      cart = new cartDB({
        userId,
        items: [],
      });
    }
    const existingProduct = cart?.items?.find(
      (item) => item.product.toString() === productId
    );
    

    if (existingProduct) {
      if (existingProduct.quantity < 5) {
        //updates the quantity
        const newQuantity = existingProduct.quantity + 1;
        if (newQuantity > product.availableQuantity)
          return next(
            errorHandler(
              STATUS_CODES.BAD_REQUEST,
              "cannot add more than available stock"
            )
          );
        existingProduct.quantity = newQuantity;
      } else {
        return next(
          errorHandler(STATUS_CODES.BAD_REQUEST, "Cannot add more than 5")
        );
      }
    } else {
      cart.items.push({
        product: productId,
        quantity: 1,
        price: product.salePrice,
      });
    }
    await cart.save();

    await wishListDB.findOneAndUpdate(
      { user: userId },
      { $pull: { products: { productId } } }
    );

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.log("Error in adding to cart ", error);
    return next(
      errorHandler(
        STATUS_CODES.SERVER_ERROR,
        "something went wrong . please try again"
      )
    );
  }
};

//to get the cart items
export const getCartProducts = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);

    let cartProducts = await cartDB
      .findOne({ userId })
      .populate("items.product");
    if (!cartProducts) {
      cartProducts = await cartDB.create({ userId, items: [] });
    }

    const response = {
      ...cartProducts.toObject(),
    };

    return res.status(STATUS_CODES.SUCCESS).json({
      message: "Cart products fetched successfully",
      cartProducts: response,
    });
  } catch (error) {
    console.log(error);
    return next(
      errorHandler(
        STATUS_CODES.SERVER_ERROR,
        "something went wrong ! Please try again"
      )
    );
  }
};


// remove cart item
export const removeCartItem = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);
    const { itemId } = req.params;

    const cart = await cartDB.findOne({ userId });
    if (!cart)
      return next(errorHandler(STATUS_CODES.NOT_FOUND, "Cart not found"));

    //find the index of the item in the cart
    const item = cart.items.find((i) => i._id.toString() === itemId);
    if (!item)
      return next(
        errorHandler(STATUS_CODES.NOT_FOUND, "Item not found in the cart")
      );

    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    await cart.save();

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Item removed from cart" });
  } catch (error) {
    console.log(error);
    return next(
      errorHandler(
        STATUS_CODES.SERVER_ERROR,
        "Internal server error ! Please try again"
      )
    );
  }
};
//update cart items quantity
export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);
    const { itemId } = req.params;
    const { change } = req.body;

    //validate change is -1 or 1
    if (typeof change !== "number" || (change !== 1 && change !== -1)) {
      return next(
        errorHandler(
          STATUS_CODES.BAD_REQUEST,
          "Change value must be either 1 or -1"
        )
      );
    }

    const cart = await cartDB.findOne({ userId });
    if (!cart)
      return next(errorHandler(STATUS_CODES.NOT_FOUND, "cart not found"));

    //find the cart items
    const item = cart.items.id(itemId);
    if (!item)
      return next(
        errorHandler(STATUS_CODES.NOT_FOUND, "item not found in the cart")
      );

    const product = await ProductDB.findById(item.product);
    if (!product)
      return next(errorHandler(STATUS_CODES.NOT_FOUND, "product not found"));

    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      next(
        errorHandler(STATUS_CODES.BAD_REQUEST, "Quantity must be atleast one")
      );
      return
    }
       
    if (newQuantity > 5) {
      next(
        errorHandler(
          STATUS_CODES.BAD_REQUEST,
          "You can only buy a quantity of 5"
        )
      );
      return
    }
    if (newQuantity > product.availableQuantity)
      return next(
        errorHandler(
          STATUS_CODES.BAD_REQUEST,
          "Requested quantity exceeds available stock"
        )
      );

    //update the cart item quantity
    item.quantity = newQuantity;
    await cart.save();
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Cart item updated successfully" });
  } catch (error) {
    console.error("Error updating cart item quantity", error);
    return next(
      errorHandler(
        STATUS_CODES.SERVER_ERROR,
        "Something went wrong! Please try again"
      )
    );
  }
};
//proceed to checkout
export const proceedToCheckout = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);
    if (!userId)
      return next(errorHandler(STATUS_CODES.UNAUTHORIZED, "unauthorized"));

    const cart = await cartDB.findOne({ userId }).populate("items.product");
    const wallet = await walletDB.findOne({ userId });

    if (!cart)
      return next(errorHandler(STATUS_CODES.NOT_FOUND, "Cart not found"));

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ cart, walletBalance: wallet.balance });
  } catch (error) {
    console.log(error);
    return next(
      errorHandler(
        STATUS_CODES.SERVER_ERROR,
        "Something went wrong!Please try again"
      )
    );
  }
};
//cart count

export const getCartCountByUserId = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);
    if (!userId)
      return next(errorHandler(STATUS_CODES.UNAUTHORIZED, "unauthorized"));

    const cart = await cartDB.findOne({ userId }).lean();

    const cartCount = cart.items.length;

    res.status(STATUS_CODES.SUCCESS).json({ success: true, count: cartCount });
  } catch (error) {
    console.log(error);
    return next(
      errorHandler(
        STATUS_CODES.SERVER_ERROR,
        "Something went wrong!Please try again"
      )
    );
  }
};
