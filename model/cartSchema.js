const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({
    userId: String, 
    items: [{
        productId: String,
        quantity: {
            type: Number,
            default: 1
        }
    }]
})
module.exports = mongoose.model('carts', cartSchema)