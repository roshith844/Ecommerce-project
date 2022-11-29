"use strict"
const express = require('express')
const router = express.Router()
const expressLayouts = require('express-ejs-layouts');
const userController = require('../controllers/userController')
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

// Routes for Cart Management
router.get('/cart', userController.viewCart)
router.get('/add-to-cart/:id', userController.addToCart)
router.get('/cart/edit-cart/:id', userController.viewEditQuantity)
router.post('/cart/update-quantity', userController.updateQuantity)
router.get('/cart/delete/:id', userController.deleteCartItem)
router.get('/checkout', userController.viewAddressSelection)
router.get('/checkout/add-address', userController.viewAddAddress)
router.post('/checkout/add-address', userController.addAddress)
router.post('/checkout/payment', userController.viewSelectPayment)
router.get('/checkout/place-order', userController.placeOrder)

// Routes for User Profile
router.get('/profile', userController.viewProfile)
router.get('/profile/edit-info', userController.viewEditProfile)
router.post('/profile/edit-info', userController.editProfile)

module.exports = router