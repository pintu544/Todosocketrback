const mongoose = require("mongoose");
const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  timestamp: { type: Date, default: Date.now },
});
activityLogSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();

  object.id = _id;
  return object;
});
module.exports = mongoose.model("activity", activityLogSchema);
