const mongoose = require("mongoose");
require('dotenv').config()
mongoose.connect(process.env.MONGODB_CONNECTION).then(() => {
    console.log("connection success");
})
    .catch((err) => {
        console.error(err);
    });
