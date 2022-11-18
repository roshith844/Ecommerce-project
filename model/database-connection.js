const mongoose = require("mongoose");
mongoose.connect('mongodb+srv://roshith:7906@cluster0.kvhy0l1.mongodb.net/?retryWrites=true&w=majority').then(() => {
    console.log("connection success");
})
    .catch((err) => {
        console.log(err);
    });