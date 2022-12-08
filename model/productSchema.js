const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    price: String,
    category: { type: String, default: 'none' },
    isDeleted: {
        type: Boolean, default: 'false'
    }
})

module.exports = mongoose.model('products', productSchema)