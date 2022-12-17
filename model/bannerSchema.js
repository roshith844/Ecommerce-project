const mongoose = require("mongoose");
const Schema = new mongoose.Schema({
  heading: { type: String },
  description: { type: String },
  image: { type: String },
});
module.exports = mongoose.model("carts", cartSchema);
