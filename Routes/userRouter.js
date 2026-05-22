import express from 'express';
import {verifyUser} from "../Middlewares/userAuthMiddleware.js"
import { requireUserRole } from "../Middlewares/verifyUser.js";
import { forgotChangePassword, forgotVerifyEmail, forgotVerifyOtp, generateAndSendOTP, generateAndSendOTPToNewEmail, googleAuth, logout, resendOTP, verifyLogin, verifyOTPAndCreateUser, verifyTheOTPForNewEmail} from '../Controllers/UserController/authController.js';
import { getProductDetails,  getProductsForShop, getRelatedProducts } from '../Controllers/UserController/productController.js';
import { getBestSellingProducts } from '../Controllers/UserController/BestSellingController.js';
import { verifyUserBlocked } from '../Middlewares/userBlockMiddleware.js';
import { editProfile,getUserProfile } from '../Controllers/UserController/profileController.js';
import { addAddress, deleteAddress, editAddress, getAddress, getAddresses, setDefaultAddress } from '../Controllers/UserController/addressController.js';
import { addToCart, getCartCountByUserId, getCartProducts, proceedToCheckout, removeCartItem, updateCartItemQuantity } from '../Controllers/UserController/cartController.js';
import { validateProduct } from '../Middlewares/productCheckMiddlleware.js';
import { cancelSingleItem, getOrderById, getOrderByItemId, getUseOrders, placeOrder, returnItem, updatePaymentStatus } from '../Controllers/UserController/orderController.js';
import { deductWalletAmount, getWalletData } from '../Controllers/UserController/walletController.js';
import { addToWishlist, getWishlist, removeFromWishlist } from '../Controllers/UserController/wishListController.js';
import { getCoupons } from '../Controllers/UserController/couponController.js';
import { generateSignedUrl, uploadToCloudinary } from '../Controllers/UserController/cloudinaryController.js';

const router=express.Router();

//Login and Signup Routes 
router.post('/signup',generateAndSendOTP);// User signup;
router.post('/signup/otp',verifyOTPAndCreateUser);//Verify the otp and create user
router.post('/signup/resend-otp',resendOTP);//resend otp
router.post('/googleLogin',googleAuth);
router.post('/login',verifyLogin);//verify the login
router.post('/new/verify-email',generateAndSendOTPToNewEmail);// verify new email
router.post('/new/verify-otp',verifyTheOTPForNewEmail);// verify new email
router.post('/forgot/verify-email',forgotVerifyEmail);//verify the email
router.post('/forgot/verify-otp',forgotVerifyOtp);//verify the otp
router.patch('/forgot/change-password',forgotChangePassword);//update the password
router.post('/logout',logout);//logout


//products
router.get('/products',getProductsForShop); 
router.get('/bestsellers',getBestSellingProducts);
router.get('/productDetails/:id',getProductDetails);
router.get('/products/relatedproducts',getRelatedProducts);

 
//profile 
router.get('/profile',verifyUser,requireUserRole,verifyUserBlocked,getUserProfile);//get user details
router.put('/profile',verifyUser,requireUserRole,verifyUserBlocked,editProfile);//edit the profile page
 
//address
router.get('/address',verifyUser,requireUserRole,verifyUserBlocked,getAddresses);//to get all addresses
router.post('/address',verifyUser,requireUserRole,verifyUserBlocked,addAddress);// to add a new address
router.get('/address/:id',verifyUser,requireUserRole,verifyUserBlocked,getAddress);// to get a particular addresses
router.put('/address/:id',verifyUser,requireUserRole,verifyUserBlocked,editAddress);// to edit the address
router.delete('/address/:id',verifyUser,requireUserRole,verifyUserBlocked,deleteAddress);//to as de delete an address
router.patch('/address/:id',verifyUser,requireUserRole,verifyUserBlocked,setDefaultAddress);//to set address as default

//cart routes
router.post('/cart',verifyUser,requireUserRole,verifyUserBlocked,addToCart); //to add items to the cart
router.get('/cart',verifyUser,requireUserRole,verifyUserBlocked,getCartProducts); //to get products in the cart
router.get('/cart-count',verifyUser,requireUserRole,verifyUserBlocked,getCartCountByUserId); //to add items to the cart
router.patch('/cart/:itemId', verifyUser,requireUserRole,verifyUserBlocked,updateCartItemQuantity); //to increase or decrease the quantity
router.delete('/cart/:itemId', verifyUser, requireUserRole, verifyUserBlocked,removeCartItem); // to remove the item from the cart
router.get('/proceedToCheckout',verifyUser, requireUserRole, verifyUserBlocked, proceedToCheckout);  //proceed to checkout

//orders
router.post('/orders',verifyUser,requireUserRole,verifyUserBlocked,validateProduct,placeOrder); //to place the order
router.get('/orders',verifyUser, requireUserRole, verifyUserBlocked, getUseOrders); // to get orders made by the user
router.get('/orders/:orderId',getOrderById); // to get a order by its id
router.get('/orders/:orderId/item/:itemId',verifyUser, requireUserRole, verifyUserBlocked, getOrderByItemId); //to get the details of an item in the order
router.patch('/orders/:orderId/item/:itemId/cancel', verifyUser, requireUserRole, verifyUserBlocked, cancelSingleItem); // to cancel a single item in the order
router.patch('/orders/:orderId/item/:itemId/return',verifyUser,requireUserRole,verifyUserBlocked,returnItem); // to return a item
router.put('/orders/:orderId/payment-status',verifyUser,requireUserRole,verifyUserBlocked, updatePaymentStatus) //to  update the payment status

//wallet 
router.get('/wallet',verifyUser,requireUserRole,verifyUserBlocked,getWalletData);// to get the wallet
router.patch('/wallet/deduct',verifyUser,requireUserRole,verifyUserBlocked,deductWalletAmount); // to deduct the money

//wishlist
router.get('/wishlist', verifyUser, requireUserRole, verifyUserBlocked, getWishlist); //to get the wishlist of the user
router.post('/wishlist/add',verifyUser, requireUserRole, verifyUserBlocked, addToWishlist); // to add items to the wishlist
router.post('/wishlist/remove',verifyUser, requireUserRole, verifyUserBlocked, removeFromWishlist); // to remove item from the wishlist


//coupon
router.get('/coupons',verifyUser,requireUserRole,verifyUserBlocked,getCoupons);

// cloudinary upload
router.post('/generate-signed-url', verifyUser,requireUserRole,verifyUserBlocked, generateSignedUrl)
router.post('/upload', verifyUser,requireUserRole,verifyUserBlocked, uploadToCloudinary)

export default router;