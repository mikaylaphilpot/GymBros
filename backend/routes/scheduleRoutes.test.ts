import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import express from "express";
import jwt from "jsonwebtoken";
import Schedule from "../models/Schedule";
import scheduleRoutes from "./scheduleRoutes";
import { request } from "../test/http";

const jwtSecret = "schedule-routes-test-secret";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/schedules", scheduleRoutes);
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

test("requires a valid bearer token", async () => {
  const response = await request(createApp(), "/api/schedules");

  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ message: "Authorization unavailable" });
});

test("creates a validated schedule for the authenticated user", async () => {
  const created = {
    _id: "schedule-123",
    userId: "signed-in-user",
    dayOfWeek: "Monday",
    startTime: "8:00 AM",
    endTime: "9:00 AM",
    activity: "Lift",
  };
  jest.spyOn(Schedule, "create").mockResolvedValue(created as never);

  const response = await request(createApp(), "/api/schedules", {
    method: "POST",
    headers: { ...authHeader("signed-in-user"), "content-type": "application/json" },
    body: JSON.stringify({
      userId: "attacker-controlled-user",
      dayOfWeek: "Monday",
      startTime: " 8:00 AM ",
      endTime: "9:00 AM",
      activity: " Lift ",
    }),
  });

  expect(response.status).toBe(201);
  expect(Schedule.create).toHaveBeenCalledWith({
    userId: "signed-in-user",
    dayOfWeek: "Monday",
    startTime: "8:00 AM",
    endTime: "9:00 AM",
    activity: "Lift",
    completedDate: null,
  });
});

test("rejects malformed schedule fields without writing to storage", async () => {
  const create = jest.spyOn(Schedule, "create");
  const response = await request(createApp(), "/api/schedules", {
    method: "POST",
    headers: { ...authHeader("signed-in-user"), "content-type": "application/json" },
    body: JSON.stringify({ dayOfWeek: "Funday", startTime: "soon", endTime: "later", activity: " " }),
  });

  expect(response.status).toBe(400);
  expect(create).not.toHaveBeenCalled();
});