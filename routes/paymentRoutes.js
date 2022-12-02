"use strict"
const express = require('express')
const router = express.Router()

router.get('/payment',(req, res)=>{
     res.send('razorpay')
})


module.exports = router