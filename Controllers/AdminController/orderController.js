import orderDB from "../../Models/orderSchema.js";
import { errorHandler } from "../../Middlewares/error.js";
import walletDB from "../../Models/walletSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";

export const getAllOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortField = "createdAt",
      sortOrder = -1,
    } = req.query;

    let query = {};
    let orders, total;

    if (status) {
      const validStatuses = ["Pending", "Returned", "Shipped", "Delivered", "Cancelled"];
      if (!validStatuses.includes(status)) {
        return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Invalid status value"));
      }
      query["items.status"] = status;
    }

    const sortableFields = ["createdAt", "totalAmount", "orderId"];
    const sortKey = sortableFields.includes(sortField) ? sortField : "createdAt";
    const sort = { [sortKey]: Number(sortOrder) === 1 ? 1 : -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
      ];

      orders = await orderDB
        .find(query)
        .populate("userId", "firstName email phone")
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      const searchLower = search.toLowerCase();
      orders = orders.filter(
        (order) =>
          order.orderId.toLowerCase().includes(searchLower) ||
          (order.userId?.firstName?.toLowerCase().includes(searchLower)) ||
          (order.userId?.email?.toLowerCase().includes(searchLower))
      );

      total = await orderDB.countDocuments(query);
    } else {
      orders = await orderDB
        .find(query)
        .populate("userId", "firstName email phone")
        .sort(sort)
        .skip(skip)
        .limit(limitNum);
      total = await orderDB.countDocuments(query);
    }

    if (!orders || orders.length === 0) {
      return next(errorHandler(STATUS_CODES.NOT_FOUND, "No orders found"));
    }

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Orders fetched successfully",
      orders,
      total, 
      page: Number(page),
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Error fetching orders for admin:", error);
    return next(errorHandler(STATUS_CODES.SERVER_ERROR, "Something went wrong! Please try again"));
  }
};

//to get a order by its id
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await orderDB
      .findOne({ orderId })
      .populate({
        path: "items.product",
        populate: { path: "Category", select: "name-_id" },
      })
      .populate("userId", "firstName , email , phone");

    if (!order) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Order Not Found"));

    return res.status(STATUS_CODES.SUCCESS).json({ order });
  } catch (error) {
    console.log(error);
    return next(errorHandler(STATUS_CODES.SERVER_ERROR, "something went wrong! please try again"));
  }
};

//change the status of a single item in the order
export const updateSingleOrderItemStatus = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { status: newStatus } = req.body;

    if (!newStatus) return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Status is required"));

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!allowedStatuses.includes(newStatus))
      return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Invalid status value"));

    const order = await orderDB.findOne({ orderId });
    if (!order) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Order not found"));

    const item = order.items.id(itemId);
    if (!item) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Item not found"));

    const allowedTransitions = {
      Pending: ["Processing", "Cancelled"],
      Processing: ["Shipped", "Cancelled"],
      Shipped: ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };
    //check if the new status is allowed
    if (!allowedTransitions[item.status].includes(newStatus)) {
      return next(
        errorHandler(
          STATUS_CODES.BAD_REQUEST,
          `cannot change status from ${item.status} to ${newStatus}`
        )
      );
    }

    item.status = newStatus;
    await order.save();

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Item status updated successfully" });
  } catch (error) {
    console.log(error)
    return next(errorHandler(STATUS_CODES.SERVER_ERROR, "Something went wrong! Please try again"));
  }
};

// to update refund status

export const updateRefundStatus = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const newRefundStatus = "Approved";
    if (!["Approved", "Rejected"].includes(newRefundStatus)) {
      return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Invalid refund status"));
    }

    const order = await orderDB.findOne({ orderId });
    if (!order) return next(errorHandler(STATUS_CODES.NOT_FOUND, "Order not found"));
    const item = order.items.id(itemId);
    if (!item) return next(errorHandler(STATUS_CODES.NOT_FOUND, "order item not found"));

    if (item.refundStatus !== "Pending") {
      return next(errorHandler(STATUS_CODES.BAD_REQUEST, "Refund request is not pending"));
    }

    //calculate the refund Amount
    const discountAmountDerived =
      order.subtotal + order.tax - order.totalAmount;
    const effectiveDiscountRate = order.subtotal
      ? discountAmountDerived / order.subtotal
      : 0;
    const refundAmount = Math.round(
      item.productPrice * item.quantity * (1 - effectiveDiscountRate)
    );
  
    item.refundStatus = newRefundStatus;
    item.refundAmount = refundAmount;
    await order.save();
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

    return res.status(STATUS_CODES.SUCCESS).json({
      message: `Refund request ${newRefundStatus.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.log("Error updating refund status", error);
    return next(
      errorHandler(STATUS_CODES.SERVER_ERROR, "Something went wrong while updating refund status")
    );
  }
};
 