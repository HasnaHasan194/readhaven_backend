import express from "express";
const router = express.Router();

//middleware
import {verifyAdmin} from "../Middlewares/adminAuthMiddleware.js"
//controllers
import { logoutAdmin, verifyLogin } from "../Controllers/AdminController/authController.js";
import { blockUser,getUsers } from "../Controllers/AdminController/customerController.js";
import { addCategory,blockCategory,editCategory,getCategory } from "../Controllers/AdminController/categoryController.js";
import { addProduct, blockProduct, editProduct, getCategoryDropDown, getProductEdit, getProducts } from "../Controllers/AdminController/productController.js";

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
 
 //product
 router.get('/product-edit/:id',verifyAdmin,getProductEdit)
 router.put('/edit/product/:id',verifyAdmin,editProduct);
 router.post('/add/product',verifyAdmin, addProduct);
 router.get('/product/category',getCategoryDropDown)
 router.get('/product',verifyAdmin,getProducts);
 router.put('/block-product/:id',verifyAdmin,blockProduct);


  


 export default router; 


