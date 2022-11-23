const express = require("express")
const app = express()
const userRouter = require('./routes/userRoutes')
const adminRouter = require('./routes/adminRoutes')
require('./model/database-connection')
// const nodemailer = require('nodemailer')

// Middlewares
app.use(express.static('public')); // Serves Static files
app.use('/', userRouter);
app.use('/admin', adminRouter)
// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set("layout", "./layouts/layout.ejs");

// Server
app.listen(7000, () => {
    console.log("Server Started")
})