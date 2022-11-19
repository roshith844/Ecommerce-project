const express = require("express")
const app = express()
const userRouter = require('./routes/userRoutes')
const adminRouter = require('./routes/adminRouter')
require('./model/database-connection')

// Middlewares
app.use(express.static('public')); // Serves Static files
app.use('/', userRouter);
app.use('/admin', adminRouter)
// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set("layout", "./layouts/layout.ejs");

// Server
app.listen(8000, () => {
    console.log("Server Started")
})