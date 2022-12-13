const mongoose = require('mongoose')
const couponSchema = new mongoose.Schema({
   coupon_code: {
     type: String
   },
   discount: {
     type: Number,
     default: 0
   }
})
module.exports = mongoose.model('coupons', couponSchema)