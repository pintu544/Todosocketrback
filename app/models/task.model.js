const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Done"],
      default: "To Do",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
taskSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();

  object.id = _id;
  return object;
});
module.exports = mongoose.model("Task", taskSchema);
