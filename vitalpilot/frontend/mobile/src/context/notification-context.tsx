import { NotificationCountContext } from "./notification-count";
import { summaryNotifications } from "@/services/summary-notifications";
import type { DailySummaryResponse } from "@/services/daily-summary";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, type Href } from "expo-router";

import { AlertBanner } from "@/components/notifications/alert-banner";
import { CriticalAlertModal } from "@/components/notifications/critical-alert-modal";
import { api, ApiError } from "@/services/api";
import type { VitalNotification } from "@/types/notification";

type NotificationContextValue = {
  notifications: VitalNotification[];
  syncSummary: (data: DailySummaryResponse) => void;
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
  const router = useRouter();
  const [notifications, setNotifications] = useState<VitalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seen = useRef(new Set<string>());
  const syncSummary = useCallback((data: DailySummaryResponse) => {
    const incoming = summaryNotifications(data).filter(n => !seen.current.has(n.id));
    incoming.forEach(n => seen.current.add(n.id));
    if (incoming.length) setNotifications(current => [...incoming, ...current].sort((a,b) => Date.parse(b.createdAt)-Date.parse(a.createdAt)));
  }, []);

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
        syncSummary,
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
      <NotificationCountContext.Provider value={unreadCount}>
        {children}
      </NotificationCountContext.Provider>

      <AlertBanner
        visible={bannerNotification !== null}
        title={bannerNotification?.title ?? ""}
        message={bannerNotification?.message ?? ""}
        severity={bannerNotification?.severity ?? "info"}
        onDismiss={() => setBannerNotification(null)}
        onPress={
          bannerNotification?.action
            ? () => {
                const route = bannerNotification.action!.route;
                const id = bannerNotification.id;
                setBannerNotification(null);
                void markAsRead(id);
                router.push(route as Href);
              }
            : undefined
        }
      />

      <CriticalAlertModal
        visible={activeCriticalNotification !== null}
        title={activeCriticalNotification?.title ?? ""}
        message={activeCriticalNotification?.message ?? ""}
        onDismiss={dismissCriticalAlert}
        onReviewMeasurement={
          activeCriticalNotification?.action
            ? () => {
                const route = activeCriticalNotification.action!.route;
                dismissCriticalAlert();
                router.push(route as Href);
              }
            : undefined
        }
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
