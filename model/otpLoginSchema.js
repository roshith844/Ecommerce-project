const mongoose = require('mongoose')
const otpLoginSchema = new mongoose.Schema({
    email: String,
    code: String
})

module.exports = mongoose.model('otpLogins', otpLoginSchema)