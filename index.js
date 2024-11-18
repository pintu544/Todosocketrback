const express = require("express");
const logger = require("morgan");
const cors = require("cors");

const socketio = require("socket.io");
const http = require("http");
const db = require("./app/models");
const userRouter = require("./app/routes/user.routes");
const testRouter = require("./app/routes/test.routes");
const postRouter = require("./app/routes/post.routes");
const todoRoutes = require("./app/routes/task.routes");
const todoController = require("./app/controllers/task.controller");

const app = express();

const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "https://todosocketrbac.netlify.app" } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(logger("dev"));

const corsOptions = {
  origin: ["https://todosocketrbac.netlify.app"],
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  req.io = io;
  next();
});

db.mongoose
  .connect(db.url)
  .then(() => {
    console.log("Connect to database :)");
    initial();
  })
  .catch((err) => {
    console.log("Cannot connect to database", err);
    process.exit();
  });

app.get("/test", (req, res) => {
  res.send({ data: "test from server!!!!" });
});

app.use("/api/user/auth", userRouter);
app.use("/api/user/test", testRouter);
app.use("/api/posts", postRouter);
app.use("/api/post/todo", todoRoutes(io));

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server is running on port : http://localhost:${PORT}.`);
});
io.on("connection", (socket) => {
  console.log(`Connected to: ${socket.id}`);

  socket.on("client:TodoAdded", async (todo) => {
    console.log("Event received (client:TodoAdded):", JSON.stringify(todo));
    try {
      if (!todo || typeof todo !== "object") {
        throw new Error("Invalid todo data");
      }
      await todoController.createTask(io, todo);
      io.emit("server:TodoAdded", todo);
      io.emit("server:taskNotification", "A new task has been added.");
    } catch (error) {
      console.error("Error handling client:TodoAdded:", error.message);
      socket.emit("server:error", "Failed to add a new task.");
    }
  });

  socket.on("client:TodoUpdated", async (todo) => {
    console.log("Event received (client:TodoUpdated):", JSON.stringify(todo));
    try {
      if (!todo || typeof todo !== "object") {
        throw new Error("Invalid todo data");
      }
      await todoController.updateTask(io, todo);
      io.emit("server:TodoUpdated", todo);
      io.emit("server:taskNotification", "A task has been updated.");
    } catch (error) {
      console.error("Error handling client:TodoUpdated:", error.message);
      socket.emit("server:error", "Failed to update the task.");
    }
  });

  socket.on("client:TodoDeleted", async (todo) => {
    console.log("Event received (client:TodoDeleted):", JSON.stringify(todo));
    try {
      if (!todo || typeof todo !== "object") {
        throw new Error("Invalid todo data");
      }
      await todoController.deleteTask(io, todo);
      io.emit("server:TodoDeleted", todo);
      io.emit("server:taskNotification", "A task has been deleted.");
    } catch (error) {
      console.error("Error handling client:TodoDeleted:", error.message);
      socket.emit("server:error", "Failed to delete the task.");
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const Role = db.role;
function initial() {
  Role.estimatedDocumentCount()
    .then((count) => {
      if (count === 0) {
        new Role({ name: "user" })
          .save()
          .then(() => console.log("added 'user' to roles collection"))
          .catch((err) => console.log("error creating initial user!", err));

        new Role({ name: "admin" })
          .save()
          .then(() => console.log("added 'admin' to roles collection"))
          .catch((err) => console.log("error creating initial admin!", err));
      }
    })
    .catch((err) =>
      console.log("error checking count in roles collection", err)
    );
}
