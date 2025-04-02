import mongoose from "mongoose";
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      default: function () {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const randomNum = Math.floor(Math.random() * 1000);
        return `READHAVEN-${year}${month}${day}-${randomNum}`;
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    deliveryAddress: {
      type: Object,
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productPrice: { type: Number },

        quantity: { type: Number },

        status: { type: String, default: "Pending" },

        returnReason: {
          type: String,
        },

        refundStatus: {
          type: String,
          enum: ["None", "Pending", "Approved", "Rejected"],
          default: "None",
        },
        refundAmount: {
          type: Number,
        },
      },
    ],
    status: {
      type: String,
      default: "Pending",
    },

    deliveryDate: {
      type: Date,
      default: () => {
        const today = new Date();
        today.setDate(today.getDate() + 6);
        return today;
      },
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      default: "Pending",
    },
    couponCode:{
      type : String,
      default : null
    }
  },
  {
    timestamps: true,
  }
);

const orderDB = mongoose.model("order", orderSchema);
export default orderDB;
