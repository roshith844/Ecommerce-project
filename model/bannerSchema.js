const mongoose = require("mongoose");
const bannerSchema = new mongoose.Schema({
  heading: { type: String },
  description: { type: String },
  image: { type: String },
  isDeleted: {type: Boolean, default: false}
});
module.exports = mongoose.model("banners", bannerSchema);
