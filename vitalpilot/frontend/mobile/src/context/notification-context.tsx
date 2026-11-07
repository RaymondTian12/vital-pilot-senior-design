import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { AlertBanner } from "@/components/notifications/alert-banner";
import { CriticalAlertModal } from "@/components/notifications/critical-alert-modal";
import { api, ApiError } from "@/services/api";
import type { VitalNotification } from "@/types/notification";

type NotificationContextValue = {
  notifications: VitalNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  activeCriticalNotification: VitalNotification | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  dismissCriticalAlert: () => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export function NotificationProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState<VitalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bannerNotification, setBannerNotification] =
    useState<VitalNotification | null>(null);

  const [activeCriticalNotification, setActiveCriticalNotification] =
    useState<VitalNotification | null>(null);

  // Tracks ids already seen so refreshNotifications only pops a banner/modal
  // for notifications that are genuinely new since the last fetch -- not for
  // every item in the list on first load.
  const knownIds = useRef<Set<string>>(new Set());
  const hasLoadedOnce = useRef(false);

  const refreshNotifications = useCallback(async () => {
    try {
      const { notifications: fetched, unreadCount: unread } =
        await api.getNotifications();
      setError(null);

      if (hasLoadedOnce.current) {
        const newest = fetched.filter((item) => !knownIds.current.has(item.id));
        const newCritical = newest.find((item) => item.severity === "critical");

        if (newCritical) {
          setActiveCriticalNotification(newCritical);
        } else if (newest.length > 0) {
          const notification = newest[0];
          setBannerNotification(notification);

          const duration = notification.severity === "warning" ? 7000 : 4000;
          setTimeout(() => {
            setBannerNotification((current) =>
              current?.id === notification.id ? null : current,
            );
          }, duration);
        }
      }

      knownIds.current = new Set(fetched.map((item) => item.id));
      hasLoadedOnce.current = true;

      setNotifications(fetched);
      setUnreadCount(unread);
    } catch (e: unknown) {
      setError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  async function markAsRead(notificationId: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await api.markNotificationRead(notificationId);
    } catch {
      void refreshNotifications();
    }
  }

  async function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
    setUnreadCount(0);
    try {
      await api.markAllNotificationsRead();
    } catch {
      void refreshNotifications();
    }
  }

  async function removeNotification(notificationId: string) {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );
    try {
      await api.deleteNotification(notificationId);
    } catch {
      void refreshNotifications();
    }
  }

  async function clearAllNotifications() {
    setNotifications([]);
    setUnreadCount(0);
    setBannerNotification(null);
    setActiveCriticalNotification(null);
    try {
      await api.clearNotifications();
    } catch {
      void refreshNotifications();
    }
  }

  function dismissCriticalAlert() {
    if (activeCriticalNotification) {
      void markAsRead(activeCriticalNotification.id);
    }
    setActiveCriticalNotification(null);
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        activeCriticalNotification,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        dismissCriticalAlert,
      }}
    >
      {children}

      <AlertBanner
        visible={bannerNotification !== null}
        title={bannerNotification?.title ?? ""}
        message={bannerNotification?.message ?? ""}
        severity={bannerNotification?.severity ?? "info"}
        onDismiss={() => setBannerNotification(null)}
      />

      <CriticalAlertModal
        visible={activeCriticalNotification !== null}
        title={activeCriticalNotification?.title ?? ""}
        message={activeCriticalNotification?.message ?? ""}
        onDismiss={dismissCriticalAlert}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider.",
    );
  }

  return context;
}
