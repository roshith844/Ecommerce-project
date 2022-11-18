const express = require('express')
const router = express.Router()
const expressLayouts = require('express-ejs-layouts');
const userController = require('../controllers/userController')

router.use(expressLayouts);

router.get('/',userController.getLogin)
router.get('/login', userController.getLogin)

module.exports = router