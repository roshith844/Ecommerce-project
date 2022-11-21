const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    price: String
})

module.exports = mongoose.model('products', productSchema)