"use strict"
const express = require('express')
const router = express.Router()
const expressLayouts = require('express-ejs-layouts');
const userController = require('../controllers/userController')
const SESSION_MANAGER = require('../middlewares/session-management')
const session = require("express-session");
const cookieParser = require("cookie-parser");


// Middlewares
router.use(expressLayouts);
router.use(express.urlencoded({ extended: true }));
router.use(express.json());
// Middlewares not to store cache
router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

router.use(cookieParser());

router.use(
    session({
        resave: true,
        saveUninitialized: true,
        secret: "secret",
    })
);

router.use(
    session({
        secret: "secret",
        saveUninitialized: true,
        cookie: { maxAge: 60000 },
        resave: false,
    })
);

// Routes
router.get('/', userController.goHome)
router.get('/login', userController.goToLogin)
router.get('/signup', userController.goTosignUp)
router.post('/signup', userController.sendToDatabase)
router.post('/login', userController.doLogin)
router.get('/otp-login', userController.getPhoneNumber)
router.post('/otp-login', userController.generateOtp) // posts phone Number for OTP
router.post('/verify-otp', userController.verifyOtp)
router.get('/product-info/:id', userController.getProductInfo)
router.get('/logout', userController.doLogout)

// Routes for Wishlist Management
router.get('/wishlist', SESSION_MANAGER.verifyLoginUser, userController.viewWishlist)
router.get('/add-to-wishlist/:id', userController.addToWishlist)
// router.get('/wishlist-add-one/:id', userController.incrementWishlistProduct)
// router.get('/wishlist-remove-one/:id', userController.decrementWishlistProduct)
// router.get('/wishlist/edit-wishlist/:id', SESSION_MANAGER.verifyLoginUser, userController.viewWishlistEditQuantity)
// router.post('/wishlist/update-quantity', SESSION_MANAGER.verifyLoginUser, userController.updateWishlistQuantity)
router.get('/wishlist/delete/:id', SESSION_MANAGER.verifyLoginUser, userController.deleteWishlistItem)

// Routes for Cart Management
router.get('/cart', SESSION_MANAGER.verifyLoginUser, userController.viewCart)
router.get('/add-to-cart/:id', userController.addToCart)
router.get('/add-one/:id', userController.incrementProduct)
router.get('/remove-one/:id', userController.decrementProduct)
router.get('/cart/edit-cart/:id', SESSION_MANAGER.verifyLoginUser, userController.viewEditQuantity)
router.post('/cart/update-quantity', SESSION_MANAGER.verifyLoginUser, userController.updateQuantity)
router.get('/cart/delete/:id', SESSION_MANAGER.verifyLoginUser, userController.deleteCartItem)

// Routes for Checkout
router.get('/checkout', SESSION_MANAGER.verifyLoginUser, userController.viewCheckout)
router.get('/checkout/add-address', SESSION_MANAGER.verifyLoginUser, userController.viewAddAddress)
router.post('/checkout/add-address', SESSION_MANAGER.verifyLoginUser, userController.addAddress)

router.post('/checkout/payment', SESSION_MANAGER.verifyLoginUser, userController.placeOrder)
router.post('/verify-payment', SESSION_MANAGER.verifyLoginUser, userController.verifyPayment)
router.get('/payment-success/:id', SESSION_MANAGER.verifyLoginUser, userController.showPaymentSuccess)
router.get('/payment-failed/:id', SESSION_MANAGER.verifyLoginUser, userController.showPaymentFailed)

// Routes for User Profile
router.get('/profile', SESSION_MANAGER.verifyLoginUser, userController.viewProfile)
router.get('/profile/edit-info', SESSION_MANAGER.verifyLoginUser, userController.viewEditProfile)
router.post('/profile/edit-info', SESSION_MANAGER.verifyLoginUser, userController.editProfile)
router.get('/profile/edit-address/:id', SESSION_MANAGER.verifyLoginUser, userController.viewEditAddress)
router.post('/profile/edit-address', SESSION_MANAGER.verifyLoginUser, userController.editAddress)
router.get('/profile/add-address', SESSION_MANAGER.verifyLoginUser, userController.profileViewAddAddress)
router.post('/profile/add-address', SESSION_MANAGER.verifyLoginUser, userController.addProfileAddress)
router.get('/profile/change-password', SESSION_MANAGER.verifyLoginUser, userController.viewChangePassword)
router.post('/profile/change-password', SESSION_MANAGER.verifyLoginUser, userController.changePassword)

// Routes for orders
router.get('/orders', SESSION_MANAGER.verifyLoginUser, userController.viewOrdersToUser)
router.get('/orders/cancel/:id', SESSION_MANAGER.verifyLoginUser, userController.cancelOrderByUser)

// 404page
router.get('/not', userController.showErrorPage)

module.exports = router