import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import userRoutes from "./userRoutes.js";

test("friends endpoints reject requests for another user's ID", async () => {
  const secret = "friends-route-test-secret";
  process.env.JWT_SECRET = secret;
  const token = jwt.sign({ userId: "signed-in-user" }, secret, { algorithm: "HS256" });
  const app = express();
  app.use("/api/users", userRoutes);
  const server = app.listen(0);

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const address = server.address();
    assert(address && typeof address !== "string");

    const endpoints = [
      ["/api/users/another-user/friends/stats", "GET"],
      ["/api/users/another-user/friends/friend-id", "POST"],
      ["/api/users/another-user/friends/friend-id", "DELETE"],
    ] as const;

    for (const [path, method] of endpoints) {
      const response: Awaited<ReturnType<typeof fetch>> = await fetch(`http://127.0.0.1:${address.port}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(response.status, 403, `${method} ${path} should be forbidden`);
    }

    const invalidCredentialsResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/users/signed-in-user/friends/stats`,
      { headers: { Authorization: "Bearer invalid-token" } },
    );
    assert.equal(invalidCredentialsResponse.status, 401, "invalid credentials should be unauthorized");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
