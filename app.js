const express = require("express")
const app = express()
const userRouter = require('./routes/userRoutes')
require('./model/database-connection')

// Middlewares
app.use(express.static('public')); // Serves Static files
app.use("/", userRouter);

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set("layout", "./layouts/layout.ejs");

app.listen(8000, () => {
    console.log("Server Started")
})