const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../server");
const User = require("../models/User");
const Task = require("../models/Task");

let mongoServer;
let authToken;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const response = await request(app).post("/api/auth/register").send({
    username: "integrationtest",
    email: "integration@test.com",
    password: "password123",
  });

  authToken = response.body.token;
  userId = response.body.user.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

describe("Task Management Flow", () => {
  it("should create, update, and delete a task", async () => {
    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Integration Test Task",
        description: "Testing the full flow",
        dueDate: new Date().toISOString(),
        status: "To Do",
      });

    expect(createResponse.status).toBe(201);
    const taskId = createResponse.body._id;

    const getResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${authToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toContainEqual(
      expect.objectContaining({
        _id: taskId,
        title: "Integration Test Task",
      })
    );

    const updateResponse = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        status: "In Progress",
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.status).toBe("In Progress");

    const deleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(deleteResponse.status).toBe(200);

    const finalGetResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${authToken}`);

    expect(finalGetResponse.body).not.toContainEqual(
      expect.objectContaining({
        _id: taskId,
      })
    );
  });

  it("should handle role-based access control", async () => {
    const adminResponse = await request(app).post("/api/auth/register").send({
      username: "adminuser",
      email: "admin@test.com",
      password: "admin123",
      role: "Admin",
    });

    const adminToken = adminResponse.body.token;

    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "User Task",
        description: "Testing permissions",
        dueDate: new Date().toISOString(),
        status: "To Do",
      });

    const taskId = createResponse.body._id;

    const unauthorizedResponse = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        status: "Done",
      });

    expect(unauthorizedResponse.status).toBe(403);

    const adminUpdateResponse = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "Done",
      });

    expect(adminUpdateResponse.status).toBe(200);
  });

  it("should handle notifications and activity logs", async () => {
    const taskResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Notification Test Task",
        description: "Testing notifications",
        dueDate: new Date().toISOString(),
        status: "To Do",
        assignedTo: userId,
      });

    const activityResponse = await request(app)
      .get("/api/activities")
      .set("Authorization", `Bearer ${authToken}`);

    expect(activityResponse.status).toBe(200);
    expect(activityResponse.body).toContainEqual(
      expect.objectContaining({
        action: "created task",
        taskId: expect.objectContaining({
          _id: taskResponse.body._id,
        }),
      })
    );

    const notificationResponse = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${authToken}`);

    expect(notificationResponse.status).toBe(200);
    expect(notificationResponse.body).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("assigned"),
        read: false,
      })
    );
  });
});
