import express from 'express';
import { forgotChangePassword, forgotVerifyEmail, forgotVerifyOtp, generateAndSendOTP, googleAuth, logout, resendOTP, verifyLogin, verifyOTPAndCreateUser} from '../Controllers/UserController/authController.js';
import { getProductDetails, getProducts, getProductsForShop, getRelatedProducts } from '../Controllers/UserController/productController.js';
import { getBestSellingProducts } from '../Controllers/UserController/BestSellingController.js';

const router=express.Router();



//Login and Signup Routes 
router.post('/signup',generateAndSendOTP);// User signup;
router.post('/signup/otp',verifyOTPAndCreateUser);//Verify the otp and create user
router.post('/signup/resend-otp',resendOTP);//resend otp
router.post('/googleLogin',googleAuth);
router.post('/login',verifyLogin);//verify the login
router.post('/forgot/verify-email',forgotVerifyEmail);//verify the email
router.post('/forgot/verify-otp',forgotVerifyOtp);//verify the otp
router.patch('/forgot/change-password',forgotChangePassword);//update the password
router.post('/logout',logout);//logout

//products
router.get('/products',getProductsForShop);
router.get('/bestsellers',getBestSellingProducts);
router.get('/productDetails/:id',getProductDetails);
router.get('/products/relatedproducts',getRelatedProducts);
export default router;
