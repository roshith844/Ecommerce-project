const express = require("express")
const app = express()
const USER_ROUTER = require('./routes/userRoutes')
const ADMIN_ROUTER = require('./routes/adminRoutes')
const PAYMENT_ROUTER = require('./routes/paymentRoutes')
require('./model/database-connection')
// const nodemailer = require('nodemailer')

// Middlewares
app.use(express.static('public')); // Serves Static files
app.use('/', USER_ROUTER);
app.use('/admin', ADMIN_ROUTER)
app.use('/', PAYMENT_ROUTER)

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set("layout", "./layouts/layout.ejs");

// Server
app.listen(7000, () => {
    console.log("Server Started")
})