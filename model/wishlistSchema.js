const mongoose = require('mongoose')
const  wishlisSchema = new mongoose.Schema({
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
})
module.exports = mongoose.model('wishlists', wishlisSchema)