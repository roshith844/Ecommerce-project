const mongoose = require('mongoose')
const otpLoginSchema = new mongoose.Schema({
    phone: String,
    code: String
})

module.exports = mongoose.model('otpLogins', otpLoginSchema)