const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: Number,
    blockStatus: { type: Boolean, default: false }
})

module.exports = mongoose.model('users', userSchema)