// AI-assisted: Initial Implementation suggested by Copilot
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { request } from "../test/http";

jest.mock("../utils/sendEmail", () => ({
  __esModule: true,
  default: jest.fn(async () => undefined),
}));

const authRoutes = require("./authRoutes").default as typeof import("./authRoutes").default;
const sendEmail = require("../utils/sendEmail").default as jest.MockedFunction<
  typeof import("../utils/sendEmail").default
>;

const jwtSecret = "auth-routes-test-secret";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  return app;
}

function authHeader(userId: string) {
  return {
    authorization: `Bearer ${jwt.sign({ userId }, jwtSecret, { algorithm: "HS256" })}`,
  };
}

beforeEach(() => {
  process.env.JWT_SECRET = jwtSecret;
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("validates signup input before looking up or creating an account", async () => {
  const findOne = jest.spyOn(User, "findOne");
  const response = await request(createApp(), "/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "new-bro", email: "not-an-email", password: "Short1!" }),
  });

  expect(response.status).toBe(400);
  expect(findOne).not.toHaveBeenCalled();
});

test("creates a user with hashed credentials and sends verification email", async () => {
  jest.spyOn(User, "findOne").mockResolvedValue(null as never);
  jest.spyOn(User, "create").mockResolvedValue({} as never);
  jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password" as never);
  const email = jest.mocked(sendEmail);

  const response = await request(createApp(), "/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: " new-bro ", email: " bro@example.com ", password: "StrongPass1!" }),
  });

  expect(response.status).toBe(201);
  expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
    username: "new-bro",
    email: "bro@example.com",
    password: "hashed-password",
    verificationToken: expect.any(String),
    verificationTokenExpires: expect.any(Date),
  }));
  expect(email).toHaveBeenCalledWith(
    "bro@example.com",
    "Verify your GymBros account",
    expect.stringContaining("/api/auth/verify-email?token="),
  );
});

test("returns only the authenticated user's public profile", async () => {
  const user = {
    _id: "user-123",
    name: "Workout Bro",
    username: "workout-bro",
    email: "bro@example.com",
    password: "never-return-this",
  };
  jest.spyOn(User, "findById").mockResolvedValue(user as never);

  const response = await request(createApp(), "/api/auth/me", {
    headers: authHeader("user-123"),
  });

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    id: "user-123",
    name: "Workout Bro",
    username: "workout-bro",
    email: "bro@example.com",
  });
});