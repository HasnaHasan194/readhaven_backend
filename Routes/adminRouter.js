import express from "express";
const router = express.Router();

//middleware
import {verifyAdmin} from "../Middlewares/adminAuthMiddleware.js"
//controllers
import { logoutAdmin, verifyLogin } from "../Controllers/AdminController/authController.js";
import { blockUser,getUsers } from "../Controllers/AdminController/customerController.js";
import { addCategory,addOffer,blockCategory,editCategory,getCategory } from "../Controllers/AdminController/categoryController.js";
import { addProduct, blockProduct, editProduct, getCategoryDropDown, getProductEdit, getProducts } from "../Controllers/AdminController/productController.js";
import { getAllOrders, updateRefundStatus, updateSingleOrderItemStatus } from "../Controllers/AdminController/orderController.js";
import { getOrderById } from "../Controllers/UserController/orderController.js";
import { blockCoupon, createCoupon, getCoupons } from "../Controllers/AdminController/couponController.js";
import getSalesReport, { downloadSalesReportExcel, downloadSalesReportPDF, getSalesAnalytics } from "../Controllers/AdminController/salesReportController.js";
import { getWalletTransactions } from "../Controllers/AdminController/walletController.js";

 //Login
 router.post("/login", verifyLogin);
 router.post('/logout',logoutAdmin);


 //Customers 
 router.get('/users',verifyAdmin,getUsers);
 router.put('/users/:id',verifyAdmin,blockUser);

 //category
 router.get('/category',verifyAdmin,getCategory);
 router.post('/add-category',verifyAdmin,  addCategory);
 router.put('/block-category/:id',verifyAdmin,  blockCategory);
 router.put('/edit-category/:id',verifyAdmin, editCategory);
 router.put('/add-offer/:id', verifyAdmin, addOffer);
 
 //product
 router.get('/product-edit/:id',verifyAdmin,getProductEdit)
 router.put('/edit/product/:id',verifyAdmin,editProduct);
 router.post('/add/product',verifyAdmin, addProduct);
 router.get('/product/category',getCategoryDropDown)
 router.get('/product',verifyAdmin,getProducts);
 router.put('/block-product/:id',verifyAdmin,blockProduct);

 //orders
 router.get('/orders',verifyAdmin, getAllOrders);
 router.get('/orders/:orderId',verifyAdmin , getOrderById); // to get a order by its id
 router.patch('/orders/:orderId/item/:itemId',verifyAdmin,updateSingleOrderItemStatus);
 router.patch('/orders/:orderId/item/:itemId/refundStatus',verifyAdmin,updateRefundStatus);

 //coupon 
 router.get('/coupon',verifyAdmin,getCoupons)//to get the coupons
 router.post('/coupon',verifyAdmin,createCoupon)//to add the coupon
 router.put('/coupon/:id',verifyAdmin,blockCoupon)// to block or unblock the coupon
 
 //sales report
 router.get('/sales-report',verifyAdmin,getSalesReport);
 router.get('/sales-report/download/pdf',verifyAdmin,downloadSalesReportPDF);
 router.get('/sales-report/download/excel',verifyAdmin,downloadSalesReportExcel);
 
 //dashboard
 router.get('/salesdashboard',verifyAdmin,getSalesAnalytics);//To get the salesanalytics for dashboard

 //wallet
 router.get('/wallet',getWalletTransactions) //to get the wallet transactions


 export default router; 


