const express = require("express");
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");
const { authJwt } = require("../middlewares/auth/authJwt"); // Middleware for authentication and authorization

const router = express.Router();

module.exports = (io) => {
  router.post("/tasks", [authJwt.verifyToken], (req, res) =>
    createTask(req, res, io)
  );
  router.get("/tasks", [authJwt.verifyToken], getTasks);
  router.put("/tasks/:id", [authJwt.verifyToken], (req, res) =>
    updateTask(req, res, io)
  );
  router.delete("/tasks/:id", [authJwt.verifyToken], (req, res) =>
    deleteTask(req, res, io)
  );
  return router;
};
