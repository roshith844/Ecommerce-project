"use strict"
const express = require('express')
const router = express.Router()
const expressLayouts = require('express-ejs-layouts');
const userController = require('../controllers/userController')
const UserModel = require('../model/userSchema')

router.use(expressLayouts);
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

router.get('/',userController.goToLogin)
router.get('/login', userController.goToLogin)
router.get('/signup', userController.goTosignUp)
router.post('/signup', userController.sendToDatabase)

module.exports = router