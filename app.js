const express = require("express")
const app = express()
const USER_ROUTER = require('./routes/userRoutes')
const ADMIN_ROUTER = require('./routes/adminRoutes')
const PAYMENT_ROUTER = require('./routes/paymentRoutes')
require('./model/database-connection')
const Razorpay = require('razorpay')
const cors = require('cors')
// const nodemailer = require('nodemailer')

// Middlewares
app.use(express.static('public')); // Serves Static files
app.use(cors())
app.use('/', USER_ROUTER);
app.use('/admin', ADMIN_ROUTER)
app.use('/', PAYMENT_ROUTER)
app.use((req, res)=>{
  res.render("not-found", { layout: false });
})

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set("layout", "./layouts/layout.ejs");


var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID ,
    key_secret: process.env.RAZORPAY_KEY_SECRET ,
  });

// Server
app.listen(7000, () => {
    console.log("Server Started")
})