const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
  },
  items: [
    {
      productId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "products",
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  address: {
    address_line_1: String,
    address_line_2: String,
    landmark: String,
    town: String,
    state: String,
    pin_code: String,
  },
  payment_method: String,
  status: {
    type: String,
    default: "pending",
  },
});
module.exports = mongoose.model("orders", orderSchema);
