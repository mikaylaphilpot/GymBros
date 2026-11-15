import { afterAll, beforeEach, expect, jest, test } from "@jest/globals";

jest.mock("firebase-admin/app", () => ({
  applicationDefault: jest.fn(() => "default-credential"),
  getApps: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock("firebase-admin/messaging", () => ({
  getMessaging: jest.fn(),
}));

const firebaseApp = require("firebase-admin/app") as typeof import("firebase-admin/app");
const firebaseMessaging = require("firebase-admin/messaging") as typeof import("firebase-admin/messaging");
const applicationDefault = firebaseApp.applicationDefault as jest.MockedFunction<typeof firebaseApp.applicationDefault>;
const getApps = firebaseApp.getApps as jest.MockedFunction<typeof firebaseApp.getApps>;
const initializeApp = firebaseApp.initializeApp as jest.MockedFunction<typeof firebaseApp.initializeApp>;
const getMessaging = firebaseMessaging.getMessaging as jest.MockedFunction<typeof firebaseMessaging.getMessaging>;
const { createFirebasePushSender } = require("./firebaseNotifications") as typeof import("./firebaseNotifications");

const originalEnabled = process.env.FCM_ENABLED;
const originalCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  if (originalEnabled === undefined) delete process.env.FCM_ENABLED;
  else process.env.FCM_ENABLED = originalEnabled;
  if (originalCredentials === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  else process.env.GOOGLE_APPLICATION_CREDENTIALS = originalCredentials;
});

test("disables the sender unless FCM is explicitly enabled", () => {
  delete process.env.FCM_ENABLED;

  expect(createFirebasePushSender()).toBeUndefined();
  expect(getMessaging).not.toHaveBeenCalled();
});

test("requires application credentials when FCM is enabled", () => {
  process.env.FCM_ENABLED = "true";
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

  expect(() => createFirebasePushSender()).toThrow(
    "GOOGLE_APPLICATION_CREDENTIALS must be set when FCM_ENABLED=true.",
  );
});

test("sends multicast payloads and returns only invalid registration tokens", async () => {
  process.env.FCM_ENABLED = "true";
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "/unused/test-credentials.json";
  jest.mocked(getApps).mockReturnValue([] as never);
  jest.mocked(initializeApp).mockReturnValue({ name: "test-app" } as never);
  const sendEachForMulticast = jest.fn(async (_message: unknown) => ({
    responses: [
      { success: true },
      { success: false, error: { code: "messaging/registration-token-not-registered" } },
      { success: false, error: { code: "messaging/invalid-argument" } },
    ],
  }));
  jest.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

  const sender = createFirebasePushSender();
  expect(sender).toBeDefined();
  await expect(sender?.send(
    ["valid-token", "expired-token", "other-error-token"],
    { title: "Workout", message: "Time to train!" },
  )).resolves.toEqual(["expired-token"]);
  expect(sendEachForMulticast).toHaveBeenCalledWith({
    tokens: ["valid-token", "expired-token", "other-error-token"],
    notification: { title: "Workout", body: "Time to train!" },
    data: { url: "/" },
  });
});

test("does not initialize Firebase for an empty token list", async () => {
  process.env.FCM_ENABLED = "true";
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "/unused/test-credentials.json";
  jest.mocked(getApps).mockReturnValue([{ name: "test-app" }] as never);
  const sendEachForMulticast = jest.fn();
  jest.mocked(getMessaging).mockReturnValue({ sendEachForMulticast } as never);

  await expect(createFirebasePushSender()?.send([], { title: "Workout", message: "Hello" })).resolves.toEqual([]);
  expect(sendEachForMulticast).not.toHaveBeenCalled();
  expect(applicationDefault).not.toHaveBeenCalled();
});