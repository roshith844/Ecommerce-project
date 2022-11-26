const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    items: [{
        productId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'products',
            required: true
        },
        quantity: {
            type: Number,
            default: 1,
            required: true
        }
    }]
})
module.exports = mongoose.model('carts', cartSchema)