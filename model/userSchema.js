const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: Number,
    address:[{
        address_line_1: String,
        address_line_2: String,
        landmark: String,
        town: String,
        state: String,
        pin_code: String
    }] ,
    blockStatus: { type: Boolean, default: false }
})

module.exports = mongoose.model('users', userSchema)