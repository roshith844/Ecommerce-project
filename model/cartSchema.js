const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    items: [{
        productId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'products',
        },
        quantity: {
            type: Number,
            default: 1
        }
    }]
})
module.exports = mongoose.model('carts', cartSchema)