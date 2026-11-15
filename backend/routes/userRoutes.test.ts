import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import userRoutes from "./userRoutes.js";
import { request } from "../test/http";

const secret = "friends-route-test-secret";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/users", userRoutes);
  return app;
}

function authHeader(userId: string) {
  const token = jwt.sign({ userId }, secret, { algorithm: "HS256" });
  return { authorization: `Bearer ${token}` };
}

beforeEach(() => {
  process.env.JWT_SECRET = secret;
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("friends endpoints reject requests for another user's ID", async () => {
  const app = createApp();

  const endpoints = [
    ["/api/users/another-user/friends/stats", "GET"],
    ["/api/users/another-user/friends/friend-id", "POST"],
    ["/api/users/another-user/friends/friend-id", "DELETE"],
  ] as const;

  for (const [path, method] of endpoints) {
    const response = await request(app, path, {
      method,
      headers: authHeader("signed-in-user"),
    });

    expect(response.status).toBe(403);
  }

  const invalidCredentials = await request(app, "/api/users/signed-in-user/friends/stats", {
    headers: { authorization: "Bearer invalid-token" },
  });
  expect(invalidCredentials.status).toBe(401);
});

test("searches users while excluding the authenticated account", async () => {
  const query = {
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn(async () => [{ _id: "other-user", username: "other-bro" }]),
  };
  jest.spyOn(User, "find").mockReturnValue(query as never);

  const response = await request(createApp(), "/api/users/search?q=bro", {
    headers: authHeader("signed-in-user"),
  });

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual([{ _id: "other-user", username: "other-bro" }]);
  expect(User.find).toHaveBeenCalledWith(expect.objectContaining({ _id: { $ne: "signed-in-user" } }));
});
