import express from "express";
const router = express.Router();

//middleware
import {verifyAdmin} from "../Middlewares/adminAuthMiddleware.js"
import { requireAdminRole } from "../Middlewares/verifyAdmin.js";
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
 router.get('/users',verifyAdmin, requireAdminRole,getUsers);
 router.put('/users/:id',verifyAdmin, requireAdminRole,blockUser);

 //category
 router.get('/category',verifyAdmin, requireAdminRole,getCategory);
 router.post('/add-category',verifyAdmin, requireAdminRole,  addCategory);
 router.put('/block-category/:id',verifyAdmin, requireAdminRole,  blockCategory);
 router.put('/edit-category/:id',verifyAdmin, requireAdminRole, editCategory);
 router.put('/add-offer/:id', verifyAdmin, requireAdminRole, addOffer);
 
 //product
 router.get('/product-edit/:id',verifyAdmin, requireAdminRole,getProductEdit)
 router.put('/edit/product/:id',verifyAdmin, requireAdminRole,editProduct);
 router.post('/add/product',verifyAdmin, requireAdminRole, addProduct);
 router.get('/product/category',getCategoryDropDown)
 router.get('/product',verifyAdmin, requireAdminRole,getProducts);
 router.put('/block-product/:id',verifyAdmin, requireAdminRole,blockProduct);

 //orders
 router.get('/orders',verifyAdmin, requireAdminRole, getAllOrders);
 router.get('/orders/:orderId',verifyAdmin, requireAdminRole, getOrderById); // to get a order by its id
 router.patch('/orders/:orderId/item/:itemId',verifyAdmin, requireAdminRole,updateSingleOrderItemStatus);
 router.patch('/orders/:orderId/item/:itemId/refundStatus',verifyAdmin, requireAdminRole,updateRefundStatus);

 //coupon 
 router.get('/coupon',verifyAdmin, requireAdminRole,getCoupons)//to get the coupons
 router.post('/coupon',verifyAdmin, requireAdminRole,createCoupon)//to add the coupon
 router.put('/coupon/:id',verifyAdmin, requireAdminRole,blockCoupon)// to block or unblock the coupon
 
 //sales report
 router.get('/sales-report',verifyAdmin, requireAdminRole,getSalesReport);
 router.get('/sales-report/download/pdf',verifyAdmin, requireAdminRole,downloadSalesReportPDF);
 router.get('/sales-report/download/excel',verifyAdmin, requireAdminRole,downloadSalesReportExcel);
 
 //dashboard
 router.get('/salesdashboard',verifyAdmin, requireAdminRole,getSalesAnalytics);//To get the salesanalytics for dashboard

 //wallet
 router.get('/wallet',getWalletTransactions) //to get the wallet transactions


 export default router; 


