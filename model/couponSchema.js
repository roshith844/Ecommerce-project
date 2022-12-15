const mongoose = require("mongoose");
const couponSchema = new mongoose.Schema({
  coupon_code: {
    type: String,
  },
  discount: {
    type: Number,
    default: 0,
  },
  discountLimit: {
     type: Number, default: 10000
  },
  purchaseLimit: {
    type: Number, default: 10000
  },
  isDeleted: {
    type: Boolean,
    default: "false",
  }
});
module.exports = mongoose.model("coupons", couponSchema);
