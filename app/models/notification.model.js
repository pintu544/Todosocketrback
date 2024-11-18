const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: String,
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});
notificationSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();

  object.id = _id;
  return object;
});
module.exports = mongoose.model("Notification", notificationSchema);
