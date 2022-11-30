const mongoose = require('mongoose')
const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'users'
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
    }], 
    status: {
        type: String,
        default: 'pending'
    }

})
module.exports = mongoose.model('orders', orderSchema)