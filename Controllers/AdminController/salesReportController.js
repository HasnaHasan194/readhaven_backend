import orderDB from "../../Models/orderSchema.js";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import PDFTableDocument from "pdfkit-table";
import ExcelJS from "exceljs";
import { errorHandler } from "../../Middlewares/error.js";
import userDB from "../../Models/userSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";

const dateRangeCalculator = (dateRange, from, to) => {
  const today = new Date();
  let startDate, endDate;

  switch (dateRange) {
    case "today": {
      startDate = startOfDay(today);
      endDate = endOfDay(today);
      break;
    }
    case "week": {
      startDate = startOfWeek(today);
      endDate = endOfWeek(today);
      break;
    }
    case "month": {
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      break;
    }
    case "year": {
      startDate = startOfYear(today);
      endDate = endOfYear(today);
      break;
    }
    case "custom":
      {
        startDate = new Date(from);
        endDate = new Date(to);
      }

      if (isNaN(startDate) || isNaN(endDate)) {
        startDate = null;
        endDate = null;
      } else if (startDate.getTime() === endDate.getTime()) {
        startDate = startOfDay(startDate);
        endDate = endOfDay(startDate);
      } else {
        startDate = startOfDay(startDate);
        endDate = endOfDay(endDate);
      }
      break;
    default:
      startDate = null;
      endDate = null;
  }

  return { startDate, endDate };
};

// const dateRangeCalculator = (dateRange, from, to) => {
//   const today = new Date();
//   let startDate, endDate;

//   switch (dateRange) {
//     case "today": {
//       startDate = startOfDay(today);
//       endDate = endOfDay(today);
//       break;
//     }
//     case "week": {
//       startDate = startOfWeek(today);
//       endDate = endOfWeek(today);
//       break;
//     }
//     case "month": {
//       startDate = startOfMonth(today);
//       endDate = endOfMonth(today);
//       break;
//     }
//     case "year": {
//       startDate = startOfYear(today);
//       endDate = endOfYear(today);
//       break;
//     }
//     case "custom": {
//       const fromDate = new Date(from);
//       const toDate = new Date(to);

//       if (isNaN(fromDate) || isNaN(toDate)) {
//         startDate = null;
//         endDate = null;
//       } else if (fromDate.getTime() === toDate.getTime()) {
//         startDate = startOfDay(fromDate);
//         endDate = endOfDay(fromDate);
//       } else {
//         startDate = startOfDay(fromDate);
//         endDate = endOfDay(toDate);
//       }
//       break;
//     }
//     default: {
//       startDate = null;
//       endDate = null;
//     }
//   }

//   return { startDate, endDate };
// };

const getSalesReport = async (req, res) => {
  try {
    const {
      filter,
      startDate: from,
      endDate: to,
      page = 1,
      limit = 2,
    } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const { startDate, endDate } = dateRangeCalculator(filter, from, to);

    if (!startDate || !endDate) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: "Invalid date range" });
    }

    // First get the total count for pagination
    const totalOrdersCount = await orderDB.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const report = await orderDB.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          reportData: [
            {
              $project: {
                orderId: 1,
                orderedDate: "$createdAt",
                userName: "$user.firstName",
                paymentMethod: 1,
                items: 1,
                totalQuantity: { $sum: "$items.quantity" },
                totalAmount: 1,
                discountAmount: 1,
                couponCode: 1,
                paymentStatus: 1,
                status: 1,
              },
            },
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSales: { $sum: "$totalAmount" },
                totalDiscount: { $sum: "$discountAmount" },
              },
            },
          ],
          paymentMethods: [
            {
              $group: {
                _id: "$paymentMethod",
                total: { $sum: "$totalAmount" },
              },
            },
          ],
        },
      },
      // Apply pagination after facet
      {
        $project: {
          reportData: { $slice: ["$reportData", skip, parsedLimit] },
          summary: 1,
          paymentMethods: 1,
        },
      },
    ]);

    const result = {
      data: report[0].reportData,
      summary: report[0].summary[0] || {
        totalOrders: 0,
        totalSales: 0,
        totalDiscount: 0,
      },
      paymentMethods: report[0].paymentMethods.reduce(
        (acc, curr) => ({
          ...acc,
          [curr._id]: curr.total,
        }),
        {}
      ),
    };

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Sales report generated successfully",
      report: result,
      totalPages: Math.ceil(totalOrdersCount / parsedLimit),
      currentPage: parsedPage,
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default getSalesReport;

export const downloadSalesReportPDF = async (req, res, next) => {
  try {
    const { filter, startDate: from, endDate: to } = req.query;
    const { startDate, endDate } = dateRangeCalculator(filter, from, to);

    if (!startDate || !endDate) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: "Invalid date range" });
    }

    // Fetch sales report data
    const ordersReport = await orderDB.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          orderId: 1,
          orderedDate: "$createdAt",
          userName: "$user.firstName",
          paymentMethod: 1,
          totalQuantity: { $sum: "$items.quantity" },
          totalAmount: 1,
          discountAmount: 1,
          couponCode: 1,
          paymentStatus: 1,
          status: 1,
        },
      },
    ]);

    // Compute summary data
    const summary = ordersReport.reduce(
      (acc, order) => {
        acc.totalOrders += 1;
        acc.totalSales += order.totalAmount;
        acc.totalDiscount += order.discountAmount || 0;
        return acc;
      },
      { totalOrders: 0, totalSales: 0, totalDiscount: 0 }
    );

    // Create PDF Document
    const doc = new PDFTableDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.pdf"
    );
    doc.pipe(res);

    // Title
    doc.fontSize(20).text("Sales Report", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Date Range: ${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`,
        { align: "center" }
      );
    doc.moveDown();

    // Summary Section
    doc.fontSize(14).text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Orders: ${summary.totalOrders}`);
    doc.text(`Total Sales: ₹${summary.totalSales.toFixed(2)}`);
    doc.text(`Total Discount: ₹${summary.totalDiscount.toFixed(2)}`);
    doc.moveDown();

    // Generate Table for Orders
    const table = {
      title: "Orders Report",
      headers: [
        "Order ID",
        "Date",
        "Customer",
        "Payment Method",
        "Total Qty",
        "Total Amount",
        "Discount",
        "Coupon",
        "Payment Status",
        "Order Status",
      ],
      rows: ordersReport.map((order) => [
        order.orderId,
        format(new Date(order.orderedDate), "MMM dd, yyyy"),
        order.userName || "N/A",
        order.paymentMethod,
        order.totalQuantity,
        `₹${order.totalAmount.toFixed(2)}`,
        `₹${(order.discountAmount || 0).toFixed(2)}`,
        order.couponCode || "-",
        order.paymentStatus,
        order.status,
      ]),
    };

    await doc.table(table);
    doc.end();
  } catch (error) {
    console.error("Error generating PDF report:", error);
    next(
      errorHandler(STATUS_CODES.SERVER_ERROR, "Error generating PDF report")
    );
  }
};

export const downloadSalesReportExcel = async (req, res, next) => {
  try {
    const { filter, startDate: from, endDate: to } = req.query;
    const { startDate, endDate } = dateRangeCalculator(filter, from, to);

    if (!startDate || !endDate) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: "Invalid date range" });
    }

    // Fetch sales report data
    const ordersReport = await orderDB.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          orderId: 1,
          orderedDate: "$createdAt",
          userName: "$user.firstName",
          paymentMethod: 1,
          totalQuantity: { $sum: "$items.quantity" },
          totalAmount: 1,
          discountAmount: 1,
          couponCode: 1,
          paymentStatus: 1,
          status: 1,
        },
      },
    ]);

    // Compute summary data
    const summary = ordersReport.reduce(
      (acc, order) => {
        acc.totalOrders += 1;
        acc.totalSales += order.totalAmount;
        acc.totalDiscount += order.discountAmount || 0;
        return acc;
      },
      { totalOrders: 0, totalSales: 0, totalDiscount: 0 }
    );

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Add Title
    worksheet.mergeCells("A1:J1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "Sales Report";
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: "center" };

    // Add Date Range
    worksheet.mergeCells("A2:J2");
    const dateRangeCell = worksheet.getCell("A2");
    dateRangeCell.value = `Date Range: ${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`;
    dateRangeCell.font = { italic: true, size: 12 };
    dateRangeCell.alignment = { horizontal: "center" };

    // Add Summary Data
    worksheet.addRow([]);
    worksheet.addRow(["Total Orders", "Total Sales (₹)", "Total Discount (₹)"]);
    worksheet.addRow([
      summary.totalOrders,
      summary.totalSales.toFixed(2),
      summary.totalDiscount.toFixed(2),
    ]);
    worksheet.addRow([]);

    // Define Column Headers
    worksheet.addRow([
      "Order ID",
      "Date",
      "Customer",
      "Payment Method",
      "Total Quantity",
      "Total Amount (₹)",
      "Discount (₹)",
      "Coupon",
      "Payment Status",
      "Order Status",
    ]).font = { bold: true };

    // Add Sales Report Data
    ordersReport.forEach((order) => {
      const row = worksheet.addRow([
        order.orderId,
        format(new Date(order.orderedDate), "MMM dd, yyyy"),
        order.userName || "N/A",
        order.paymentMethod,
        order.totalQuantity,
        order.totalAmount.toFixed(2),
        (order.discountAmount || 0).toFixed(2),
        order.couponCode || "-",
        order.paymentStatus,
        order.status,
      ]);
      row.getCell(5).alignment = { horizontal: "left" };
    });

    // Auto-fit Columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        maxLength = Math.max(
          maxLength,
          cell.value ? cell.value.toString().length : 10
        );
      });
      column.width = maxLength + 2;
    });

    // Set Response Headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.xlsx"
    );

    // Write Excel file to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    next(
      errorHandler(STATUS_CODES.SERVER_ERROR, "Error generating Excel report")
    );
  }
};

// get Sales Analytics controller
export const getSalesAnalytics = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;

    const validFilters = ["daily", "weekly", "monthly", "yearly"];
    if (!validFilters.includes(filter)) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ error: "Invalid filter parameter" });
    }

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Sales Data Aggregation
    const salesData = await orderDB.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: getDateGrouping(filter),
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Best selling categories
    const categories = await orderDB.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.Category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category.name",
          totalSales: { $sum: "$items.quantity" },
          revenue: {
            $sum: { $multiply: ["$items.quantity", "$items.productPrice"] },
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    // Best Selling Brands
    const brands = await orderDB.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "brands",
          localField: "product.brand",
          foreignField: "_id",
          as: "brandInfo",
        },
      },
      { $unwind: "$brandInfo" },
      {
        $group: {
          _id: "$brandInfo.name",
          totalSales: { $sum: "$items.quantity" },
          revenue: {
            $sum: { $multiply: ["$items.quantity", "$items.productPrice"] },
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    // User Signups
    const users = await userDB.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: getDateGrouping(filter),
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Total Orders and Revenue
    const totals = await orderDB.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Top Products
    const topProducts = await orderDB.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.name",
          totalSales: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 7 },
    ]);

    // Order status breakdown
    const orderStatusData = await orderDB.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Payment method breakdown
    const paymentMethodData = await orderDB.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          total: { $sum: "$totalAmount" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: {
        sales: formatSalesData(salesData, filter),
        categories,
        brands,
        topProducts,
        users: formatUserData(users, filter),
        totals: totals[0] || { totalRevenue: 0, totalOrders: 0 },
        orderStatus: orderStatusData,
        paymentMethods: paymentMethodData,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ success: false, error: "Server error" });
  }
};

// Helper functions
const getDateGrouping = (filter) => {
  const formats = {
    daily: "%Y-%m-%d",
    weekly: "%Y-%U",
    monthly: "%Y-%m",
    yearly: "%Y",
  };
  return { $dateToString: { format: formats[filter], date: "$createdAt" } };
};

const formatSalesData = (data, filter) => {
  return data.map((item) => ({
    date: formatDateLabel(item._id, filter),
    revenue: item.totalRevenue,
    orders: item.orderCount,
  }));
};

const formatUserData = (data, filter) => {
  return data.map((item) => ({
    date: formatDateLabel(item._id, filter),
    count: item.count,
  }));
};

const formatDateLabel = (dateString, filter) => {
  switch (filter) {
    case "daily": {
      return new Date(dateString).toLocaleDateString();
    }
    case "weekly": {
      const [year, week] = dateString.split("-");
      return `Week ${week}, ${year}`;
    }
    case "monthly": {
      const [y, m] = dateString.split("-");
      return new Date(y, m - 1).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }

    case "yearly": {
      return dateString;
    }

    default: {
      return dateString;
    }
  }
};
