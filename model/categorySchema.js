const mongoose = require('mongoose')
const categorySchema = new mongoose.Schema({
    category_name: String
})
module.exports = mongoose.model('categories', categorySchema)