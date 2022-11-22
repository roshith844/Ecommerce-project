"use strict"
const express = require('express')
const router = express.Router()
const expressLayouts = require('express-ejs-layouts')
const adminController = require('../controllers/adminController')
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
router.get('/', adminController.goToAdminHome)
router.get('/login', adminController.goToAdminLogin)
router.post('/login', adminController.doAdminLogin)
router.get('/users', adminController.listUsers)
router.get('/users/block/:id', adminController.blockUser)
router.get('/users/unblock/:id', adminController.unblockUser)
router.get('/products', adminController.listProducts)
router.get('/products/edit-product/:id', adminController.goToEditProduct)
router.post('/products/edit-product/:id', adminController.editProduct)
router.get('/products/delete-product/:id', adminController.deleteProduct)
router.get('/logout', adminController.doAdminLogout)

module.exports = router