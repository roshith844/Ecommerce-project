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
router.get('/add-to-cart/:id', userController.addToCart)

module.exports = router