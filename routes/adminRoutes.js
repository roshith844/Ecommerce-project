"use strict";
const express = require("express");
const router = express.Router();
const expressLayouts = require("express-ejs-layouts");
const adminController = require("../controllers/adminController");
const SESSION_MANAGER = require('../middlewares/session-management')
const session = require("express-session");
const cookieParser = require("cookie-parser");
const multer = require('multer')
const upload = require('../middlewares/image-upload')
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
router.get("/", adminController.goToAdminHome);
router.get("/login", adminController.goToAdminLogin);
router.post("/login", adminController.doAdminLogin);

router.get("/users", SESSION_MANAGER.verifyLoginAdmin, adminController.listUsers);
router.get("/users/block/:id", SESSION_MANAGER.verifyLoginAdmin, adminController.blockUser);
router.get("/users/unblock/:id", SESSION_MANAGER.verifyLoginAdmin, adminController.unblockUser);
router.get("/products", SESSION_MANAGER.verifyLoginAdmin, adminController.listProducts);
router.get("/products/add-product", SESSION_MANAGER.verifyLoginAdmin, adminController.viewAddProduct);
router.post("/products/add-product", SESSION_MANAGER.verifyLoginAdmin, upload.single("image"), adminController.AddProduct);
router.get("/products/edit-product/:id", SESSION_MANAGER.verifyLoginAdmin, adminController.goToEditProduct);
router.post("/products/edit-product/:id", SESSION_MANAGER.verifyLoginAdmin, adminController.editProduct);
router.get("/products/delete-product/:id", SESSION_MANAGER.verifyLoginAdmin, adminController.deleteProduct);
router.get("/categories", SESSION_MANAGER.verifyLoginAdmin, adminController.ViewCategories);
router.get("/categories/add", SESSION_MANAGER.verifyLoginAdmin, adminController.viewAddCategory);
router.post("/categories/add", SESSION_MANAGER.verifyLoginAdmin, adminController.addCategory);
router.get("/categories/edit/:id", SESSION_MANAGER.verifyLoginAdmin, adminController.viewEditCategory);
router.post("/categories/edit/:id", SESSION_MANAGER.verifyLoginAdmin, adminController.editCategory);
router.get("/categories/delete/:id", SESSION_MANAGER.verifyLoginAdmin, adminController.deleteCategory);

router.get("/orders", SESSION_MANAGER.verifyLoginAdmin, adminController.viewOrders);
router.get("/orders/change-status/:id", SESSION_MANAGER.verifyLoginAdmin, adminController.viewChangeStatus);
router.post("/orders/change-status", SESSION_MANAGER.verifyLoginAdmin, adminController.changeStatus);
router.get("/orders/cancel/:id", SESSION_MANAGER.verifyLoginAdmin, adminController.cancelOrder);

// Routes for Coupon Management
router.get('/coupons', SESSION_MANAGER.verifyLoginAdmin, adminController.viewCoupons)

router.get("/logout", SESSION_MANAGER.verifyLoginAdmin, adminController.doAdminLogout);

module.exports = router;
