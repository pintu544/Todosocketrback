const db = require("../models");
const taskModel = db.task;

exports.createTask = async (req, res, io) => {
  try {
    const { title, description, dueDate, assignedTo } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required." });
    }

    if (req.user.role.name === "admin" && !assignedTo) {
      return res
        .status(400)
        .json({ error: "Assigned user is required for admins." });
    }

    const task = new taskModel({
      title,
      description,
      dueDate,
      assignedTo: assignedTo || req.user.sub,
      createdBy: req.user.sub,
    });

    await task.save();

    res.status(201).json(task);

    io.emit("server:TodoAdded", task);
  } catch (error) {
    console.error("Error creating task:", error.message);
    res.status(500).json({ error: "Failed to create task." });
  }
};

// Get All Tasks
exports.getTasks = async (req, res) => {
  try {
    const { sub: userId, role } = req.user;
    const userRole = role.name;

    let tasks = [];
    if (userRole === "admin") {
      tasks = await taskModel.find();
    } else {
      tasks = await taskModel.find({
        $or: [{ assignedTo: userId }, { createdBy: userId }],
      });
    }

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error retrieving tasks:", error.message);
    return res.status(500).json({ error: "Failed to retrieve tasks." });
  }
};

exports.updateTask = async (req, res, io) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Task ID is required." });
    }

    const updatedTask = await taskModel.findByIdAndUpdate(
      id,
      { title, description, dueDate, status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json(updatedTask);

    // Notify all connected clients
    io.emit("server:TodoUpdated", updatedTask);
  } catch (error) {
    console.error("Error updating task:", error.message);
    res.status(500).json({ error: "Failed to update task." });
  }
};

// Delete Task
exports.deleteTask = async (req, res, io) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Task ID is required." });
    }

    const deletedTask = await taskModel.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.status(204).send();

    // Notify all connected clients
    io.emit("server:TodoDeleted", { id });
  } catch (error) {
    console.error("Error deleting task:", error.message);
    res.status(500).json({ error: "Failed to delete task." });
  }
};
