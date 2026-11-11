import {
  applicationDefault,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getMessaging, type MulticastMessage } from "firebase-admin/messaging";

export interface NativeNotification {
  title: string;
  message: string;
  url?: string;
}

export interface NativePushSender {
  send(tokens: string[], notification: NativeNotification): Promise<string[]>;
}

function isInvalidRegistrationToken(errorCode: string | undefined): boolean {
  return (
    errorCode === "messaging/registration-token-not-registered" ||
    errorCode === "messaging/invalid-registration-token"
  );
}

export function createFirebasePushSender(): NativePushSender | undefined {
  if (process.env.FCM_ENABLED !== "true") return undefined;

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS must be set when FCM_ENABLED=true.",
    );
  }

  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault() });
  const messaging = getMessaging(app);

  return {
    async send(tokens, notification) {
      if (tokens.length === 0) return [];

      const message: MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          url: notification.url ?? "/",
        },
      };
      const response = await messaging.sendEachForMulticast(message);
      return response.responses.flatMap((result, index) =>
        result.success || !isInvalidRegistrationToken(result.error?.code)
          ? []
          : [tokens[index]],
      );
    },
  };
}
