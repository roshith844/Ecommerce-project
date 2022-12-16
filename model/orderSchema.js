const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
  },
  payment_order_id: {
    type: String
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
  amount: {
    type: Number, default : 0
  },
  date: {
    type: Date,
    default: new Date()
  },
  status: {
    type: String,
    default: "pending",
  }
});
module.exports = mongoose.model("orders", orderSchema);
