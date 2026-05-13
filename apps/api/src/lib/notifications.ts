import type { NotificationItem } from "@collecta/shared/types";
import type { Notifications } from "@collecta/db";
import { publish } from "./events";

export function toNotificationItem(
  notification: Notifications,
): NotificationItem {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    metadata: notification.metadata,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export function publishNotificationCreated(
  notification: NotificationItem,
): void {
  publish(
    {
      type: "NOTIFICATION_CREATED",
      payload: {
        notification,
      },
    },
    {
      targetUserIds: [notification.userId],
    },
  );
}

export function publishNotificationsCreated(
  notifications: NotificationItem[],
): void {
  for (const notification of notifications) {
    publishNotificationCreated(notification);
  }
}
