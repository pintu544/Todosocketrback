const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  timestamp: { type: Date, default: Date.now },
});
logSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();

  object.id = _id;
  return object;
});
module.exports = mongoose.model("Log", logSchema);
