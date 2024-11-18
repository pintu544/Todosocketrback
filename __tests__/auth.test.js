const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../server");
const User = require("../models/User");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe("Authentication Endpoints", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        firstname: "testuser",
        lastname: "lastname",
        email: "test@test.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("username", "testuser");
    });

    it("should not allow duplicate emails", async () => {
      await request(app).post("/api/auth/register").send({
        firstname: "testuser",
        lastname: "lastname",
        email: "test@test.com",
        password: "password123",
      });

      const res = await request(app).post("/api/auth/register").send({
        firstname: "testuser",
        lastname: "lastname",
        email: "test@test.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        firstname: "testuser",
        lastname: "lastname",
        email: "test@test.com",
        password: "password123",
      });
    });

    it("should login with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("should not login with incorrect password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error");
    });
  });
});
