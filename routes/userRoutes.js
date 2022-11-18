const express = require('express')
const router = express.Router()
const expressLayouts = require('express-ejs-layouts');
const userController = require('../controllers/userController')

router.use(expressLayouts);

router.get('/',userController.goToLogin)
router.get('/login', userController.goToLogin)
router.get('/signup', userController.goTosignUp)

module.exports = router