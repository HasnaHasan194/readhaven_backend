import cartDB from "../../Models/cartSchema.js";
import orderDB from "../../Models/orderSchema.js";
import ProductDB from "../../Models/productSchema.js";
import { errorHandler } from "../../Middlewares/error.js";
import userDB from "../../Models/userSchema.js";
import dayjs from "dayjs";
import { refreshTokenDecoder } from "../../utils/jwtTokens/decodeRefreshToken.js";
import CouponDB from "../../Models/couponSchema.js";
import walletDB from "../../Models/walletSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";

//to get all orders made by a user
export const getUseOrders = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);
    if (!userId) return next(errorHandler(STATUS_CODES.UNAUTHORIZED, "unauthorized"));

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalOrders = await orderDB.countDocuments({ userId });

    const totalPages = Math.ceil(totalOrders / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const orders = await orderDB
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "items.product" });

    if (!orders.length && page === 1) {
      res.status(STATUS_CODES.SUCCESS).json({
        message: "Orders fetched successfully",
        orders: [],
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNextPage,
          hasPrevPage,
        },
      });
      return;
    }

    // Calculate pagination

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Orders fetched successfully",
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching user orders", error);
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong! Please try again"));
  }
};

// to place a  order
export const placeOrder = async (req, res, next) => {
  try {
    const {
      paymentMethod,
      deliveryAddress,
      subtotal,
      tax,
      totalAmount,
      paymentStatus,
      discountAmount,
      couponCode,
    } = req.body;
    console.log(req.body);
    console.log("discount amount:", discountAmount);

    const userId = req.userId;
    const items = req.cartItems;

    const user = await userDB.findById(userId);
    if (!user) return next(errorHandler(STATUS_CODES.NOT_FOUND, "User not found"));

    let coupon = null;
    if (couponCode) {
      coupon = await CouponDB.findOne({ code: couponCode });
      if (!coupon) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Invalid coupon code"));

      //check if the user has already used this coupon
      if (user.usedCoupons.includes(coupon._id)) {
        return next(errorHandler(STATUS_CODES.BAD_REQUEST, "You have already used this coupon"));
      }
    }

    const newOrderDetails = {
      userId,
      deliveryAddress,
      items,
      paymentMethod,
      paymentStatus,
      subtotal,
      tax,
      discountAmount,
      totalAmount,
      couponCode,
    };

    // Create a new order
    const newOrder = new orderDB(newOrderDetails);

    if (coupon) {
      await userDB.findByIdAndUpdate(userId, {
        $push: { usedCoupons: coupon._id },
      });
    }

    const updateTask = [];
    updateTask.push(cartDB.updateOne({ userId }, { $set: { items: [] } }));

    //  update the product availability
    items.forEach((item) => {
      const productId = item.product._id;
      const quantityPurchased = item.quantity;

      updateTask.push(
        ProductDB.updateOne(
          { _id: productId },
          { $inc: { "product.availableQuantity": -quantityPurchased } },
          { runValidators: true }
        )
      );
    });

    await Promise.all(updateTask);

    await newOrder.save();

    res.status(201).json({ message: "Order placed successfully", newOrder });
  } catch (error) {
    console.error(error);
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong! Please try again"));
  }
};

// to get a order by its id
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await orderDB
      .findOne({ orderId })
      .populate({
        path: "items.product",
        populate: { path: "Category", select: "name -_id" },
      })
      .populate("userId", "firstName,email,phone");
    if (!order) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Order Not Found"));

    console.log(order);
    return res.status(STATUS_CODES.SUCCESS).json({ order });
  } catch (error) {
    console.log(error);
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "something went wrong! please try again"));
  }
};

//to get the details of an item in the order
export const getOrderByItemId = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await orderDB.findOne({ orderId }).populate("items.product");

    if (!order) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Order not found"));

    const item = order.items.find((i) => i._id.toString() === itemId);

    if (!item) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Item not found in the order"));

    const itemDetail = {
      orderId: order.orderId,
      deliveryAddress: order.deliveryAddress,
      itemDetails: {
        product: item.product,
        productPrice: item.productPrice,
        quantity: item.quantity,
        status: item.status,
        refundStatus: item.refundStatus,
        refundAmount: item.refundAmount,
      },
      subtotal: order.subtotal,
      tax: order.tax,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      deliveryDate: order.deliveryDate,
      orderDate: order.createdAt,
    };
    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "item details fetched successfully", itemDetail });
  } catch (error) {
    console.log(error)
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "something went wrong!please trffdfy again"));
  }
};

//to cancel an order
export const cancelOrder = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);
    const { orderId } = req.params;
    const order = await orderDB.findOne({ orderId, userId });
    if (!order) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Order not found"));

    if (order.status !== "Pending" && order.status !== "Processing")
      return errorHandler(STATUS_CODES.BAD_REQUEST, "Order cannot be cancelled at this stage");

    order.status = "Cancelled";

    //to update the status of each item in the order to cancelled
    order.items.forEach((item) => {
      item.status = "Cancelled";
    });

    //to update the refund status of each item in the order to pending
    order.items.forEach((item) => {
      item.refundStatus = "Pending";
    });

    await order.save();

    const updateTasks = order.items.map((item) => {
      const productId = item.product._id;

      return ProductDB.updateOne({ _id: productId });
    });

    await Promise.all(updateTasks);

    res.status(STATUS_CODES.SUCCESS).json({ message: "Order Cancelled Successfully", order });
  } catch (error) {
    console.log(error);
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong! Please try again"));
  }
};
// to cancel a single order

export const cancelSingleItem = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);
    const { orderId, itemId } = req.params;

    const order = await orderDB.findOne({ orderId, userId });
    if (!order) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Order not found"));
    const item = order.items.id(itemId);
    if (!item) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Order not found"));
    if (item.status !== "Pending" && item.status !== "Processing")
      return next(errorHandler(STATUS_CODES.BAD_REQUEST, "order cannot be cancelled at this stage"));
    item.status = "Cancelled";
    

    //calculate the refund Amount
    const discountAmountDerived =
      order.subtotal + order.tax - order.totalAmount;
    const effectiveDiscountRate = order.subtotal
      ? discountAmountDerived / order.subtotal
      : 0;
    const refundAmount = Math.round(
      item.productPrice * item.quantity * (1 - effectiveDiscountRate)
    );

    item.refundStatus = "Approved";
    item.refundAmount = refundAmount;
    await order.save();

     //to update the wallet
     const walletUpdate = await walletDB.updateOne(
          { userId: order.userId },
          {
            $push: {
              transactions: {
                description: `Refund for order ${order.orderId}`,
                transactionDate: new Date(),
                transactionType: "Credit",
                transactionStatus: "Success",
                amount: refundAmount,
              },
            },
            $inc: { balance: refundAmount },
          },
          { upsert: true }
        );
    
        if (walletUpdate.modifiedCount === 0 && walletUpdate.upsertedCount === 0) {
          return next(errorHandler(STATUS_CODES.NOT_FOUND, "Wallet not found"));
        }

    const productId = item.product;
    const quantityToRevert = item.quantity;
    await ProductDB.updateOne(
      { _id: productId },
      {
        $inc: { availableQuantity: quantityToRevert },
      }
    );
    return res.status(STATUS_CODES.SUCCESS).json({ message: "Ordered  item is cancelled and amount is refunded to your wallet" });
  } catch (error) {
    console.log("Error in cancelling the item", error);
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong!Please try again"));
  }
};

//to return a order
export const returnItem = async (req, res, next) => {
  try {
    const userId = refreshTokenDecoder(req);
    const { orderId, itemId } = req.params;
    const { returnReason } = req.body;

    const order = await orderDB.findOne({ orderId, userId });
    if (!order) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Order not found"));

    const item = order.items.id(itemId);
    if (!item) return next(errorHandler(STATUS_CODES.NOT_FOUND, "order item not found"));

    if (item.status === "Returned")
      return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Item has already been returned"));

    if (item.status !== "Delivered")
      return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Item cannot be returned before delivery"));

    const deliveryDate = dayjs(order.deliveryDate);

    const returnDeadline = deliveryDate.add(7, "day");

    if (dayjs().isAfter(returnDeadline)) {
      return next(
        errorHandler(
          STATUS_CODES.BAD_REQUEST,
          "Return window has expired. Items can only be returned within 7 days of delivery."
        )
      );
    }

    item.status = "Returned";
    item.returnReason = returnReason;
    item.refundStatus = "Pending";

    await order.save();

    const productId = item.product;
    const quantityToRevert = item.quantity;

    await ProductDB.updateOne(
      { _id: productId },
      {
        $inc: { availableQuantity: quantityToRevert },
      }
    );

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Item return processed successfully" });
  } catch (error) {
    console.log(error)
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong"));
  }
};

export const updatePaymentStatus = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;

    const order = await orderDB.findOne({orderId});

    if (!order) {
      return next(errorHandler(STATUS_CODES.NOT_FOUND, "Order Not Found"));
    }

    order.paymentStatus = status;

    await order.save();

    res.status(STATUS_CODES.SUCCESS).json({ success: true, message: "Payment status updated." });
  } catch (error) {
    console.log(error)
    return next(errorHandler(STATUS_CODES. SERVER_ERROR, "Something went wrong"));
  }
};
