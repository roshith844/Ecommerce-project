const express = require('express')
const router = express.Router()
const expressLayouts = require('express-ejs-layouts');

router.use(expressLayouts);

router.get('/', (req, res) => {
    res.render('login')
})
router.get('/login', (req, res) => {
    res.render('login')
})

module.exports = router