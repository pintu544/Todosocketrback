const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const jwt = require("jsonwebtoken");

describe("WebSocket Connection", () => {
  let io, serverSocket, clientSocket, httpServer;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      io.on("connection", (socket) => {
        serverSocket = socket;
      });
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  test("should authenticate with valid token", (done) => {
    const token = jwt.sign(
      { userId: "testUserId" },
      process.env.JWT_SECRET || "test-secret"
    );

    clientSocket.emit("authenticate", token);

    serverSocket.on("authenticate", (receivedToken) => {
      expect(receivedToken).toBe(token);
      done();
    });
  });

  test("should receive task updates", (done) => {
    const mockTask = {
      _id: "task123",
      title: "Test Task",
      status: "In Progress",
    };

    clientSocket.on("taskUpdated", (task) => {
      expect(task).toEqual(mockTask);
      done();
    });

    serverSocket.emit("taskUpdated", mockTask);
  });
});
