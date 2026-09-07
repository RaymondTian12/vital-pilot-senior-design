import {
    createContext,
    PropsWithChildren,
    useContext,
    useMemo,
    useState,
  } from 'react';
  
  import {
    AlertBanner,
  } from '@/components/notifications/alert-banner';
  
  import {
    CriticalAlertModal,
  } from '@/components/notifications/critical-alert-modal';
  
  import type {
    MetricEvaluation,
    NotificationSeverity,
    VitalNotification,
  } from '@/types/notification';
  
  type AddNotificationInput = {
    title: string;
    message: string;
  
    severity: NotificationSeverity;
  
    category:
      | 'metric'
      | 'report'
      | 'reminder'
      | 'system'
      | 'health-alert';
  
    metricName?: string;
    metricValue?: string;
  
    action?: {
      label: string;
      route: string;
    };
  };
  
  type NotificationContextValue = {
    notifications: VitalNotification[];
  
    unreadCount: number;
  
    activeCriticalNotification:
      | VitalNotification
      | null;
  
    addNotification: (
      notification: AddNotificationInput
    ) => void;
  
    addMetricEvaluation: (
      metricName: string,
      metricValue: string,
      evaluation: MetricEvaluation
    ) => void;
  
    markAsRead: (
      notificationId: string
    ) => void;
  
    markAllAsRead: () => void;
  
    removeNotification: (
      notificationId: string
    ) => void;
  
    clearAllNotifications: () => void;
  
    dismissCriticalAlert: () => void;
  };
  
  const NotificationContext =
    createContext<
      NotificationContextValue | undefined
    >(undefined);
  
  const initialNotifications: VitalNotification[] =
    [
      {
        id: 'welcome-report',
  
        title: 'Weekly Health Summary',
        message:
          'Your latest health summary is ready to review.',
  
        severity: 'info',
        category: 'report',
  
        read: false,
  
        createdAt:
          new Date().toISOString(),
  
        action: {
          label: 'View Report',
          route: '/reports',
        },
      },
  
      {
        id: 'logging-reminder',
  
        title: 'Health Logging Reminder',
        message:
          'Remember to record your selected health measurements today.',
  
        severity: 'info',
        category: 'reminder',
  
        read: false,
  
        createdAt:
          new Date(
            Date.now() -
              60 * 60 * 1000
          ).toISOString(),
  
        action: {
          label: 'Log Health Data',
          route: '/metrics',
        },
      },
    ];
  
  export function NotificationProvider({
    children,
  }: PropsWithChildren) {
    const [
      notifications,
      setNotifications,
    ] = useState<VitalNotification[]>(
      initialNotifications
    );
  
    const [
      bannerNotification,
      setBannerNotification,
    ] =
      useState<VitalNotification | null>(
        null
      );
  
    const [
      activeCriticalNotification,
      setActiveCriticalNotification,
    ] =
      useState<VitalNotification | null>(
        null
      );
  
    const unreadCount = useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification.read
        ).length,
      [notifications]
    );
  
    function createId() {
      return `notification-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;
    }
  
    function addNotification(
      input: AddNotificationInput
    ) {
      const notification: VitalNotification =
        {
          id: createId(),
  
          title: input.title,
          message: input.message,
  
          severity: input.severity,
          category: input.category,
  
          read: false,
  
          createdAt:
            new Date().toISOString(),
  
          metricName:
            input.metricName,
  
          metricValue:
            input.metricValue,
  
          action: input.action,
        };
  
      setNotifications((current) => [
        notification,
        ...current,
      ]);
  
      if (
        notification.severity ===
        'critical'
      ) {
        setActiveCriticalNotification(
          notification
        );
  
        return;
      }
  
      setBannerNotification(
        notification
      );
  
      /*
       * Information / success banners disappear
       * automatically.
       *
       * Warnings remain slightly longer.
       */
  
      const duration =
        notification.severity ===
        'warning'
          ? 7000
          : 4000;
  
      setTimeout(() => {
        setBannerNotification(
          (current) =>
            current?.id ===
            notification.id
              ? null
              : current
        );
      }, duration);
    }
  
    function addMetricEvaluation(
      metricName: string,
      metricValue: string,
      evaluation: MetricEvaluation
    ) {
      if (
        evaluation.severity ===
        'normal'
      ) {
        addNotification({
          title:
            'Measurement Saved',
  
          message:
            `${metricName} was recorded successfully.`,
  
          severity: 'success',
  
          category: 'metric',
  
          metricName,
          metricValue,
  
          action: {
            label: 'View Measurement',
            route: '/metrics',
          },
        });
  
        return;
      }
  
      if (
        evaluation.severity ===
        'critical'
      ) {
        addNotification({
          title:
            evaluation.title ??
            'Critical Health Alert',
  
          message:
            evaluation.message ??
            'VitalPilot received a critical health alert from the health analytics service.',
  
          severity: 'critical',
  
          category:
            'health-alert',
  
          metricName,
          metricValue,
  
          action: {
            label:
              'Review Measurement',
            route: '/metrics',
          },
        });
  
        return;
      }
  
      if (
        evaluation.severity ===
        'warning'
      ) {
        addNotification({
          title:
            evaluation.title ??
            'Health Measurement Warning',
  
          message:
            evaluation.message ??
            'Your latest measurement requires attention.',
  
          severity: 'warning',
  
          category:
            'health-alert',
  
          metricName,
          metricValue,
  
          action: {
            label:
              'Review Measurement',
            route: '/metrics',
          },
        });
  
        return;
      }
  
      addNotification({
        title:
          evaluation.title ??
          'Health Update',
  
        message:
          evaluation.message ??
          'New health information is available.',
  
        severity: 'info',
  
        category: 'metric',
  
        metricName,
        metricValue,
  
        action: {
          label: 'View Measurement',
          route: '/metrics',
        },
      });
    }
  
    function markAsRead(
      notificationId: string
    ) {
      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    read: true,
                  }
                : notification
          )
      );
    }
  
    function markAllAsRead() {
      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              read: true,
            })
          )
      );
    }
  
    function removeNotification(
      notificationId: string
    ) {
      setNotifications(
        (current) =>
          current.filter(
            (notification) =>
              notification.id !==
              notificationId
          )
      );
    }
  
    function clearAllNotifications() {
      setNotifications([]);
      setBannerNotification(null);
      setActiveCriticalNotification(
        null
      );
    }
  
    function dismissCriticalAlert() {
      if (
        activeCriticalNotification
      ) {
        markAsRead(
          activeCriticalNotification.id
        );
      }
  
      setActiveCriticalNotification(
        null
      );
    }
  
    return (
      <NotificationContext.Provider
        value={{
          notifications,
  
          unreadCount,
  
          activeCriticalNotification,
  
          addNotification,
  
          addMetricEvaluation,
  
          markAsRead,
  
          markAllAsRead,
  
          removeNotification,
  
          clearAllNotifications,
  
          dismissCriticalAlert,
        }}
      >
        {children}
  
        <AlertBanner
          visible={
            bannerNotification !== null
          }
          title={
            bannerNotification?.title ??
            ''
          }
          message={
            bannerNotification?.message ??
            ''
          }
          severity={
            bannerNotification?.severity ??
            'info'
          }
          onDismiss={() =>
            setBannerNotification(null)
          }
        />
  
        <CriticalAlertModal
          visible={
            activeCriticalNotification !==
            null
          }
          title={
            activeCriticalNotification?.title ??
            ''
          }
          message={
            activeCriticalNotification?.message ??
            ''
          }
          onDismiss={
            dismissCriticalAlert
          }
        />
      </NotificationContext.Provider>
    );
  }
  
  export function useNotifications() {
    const context =
      useContext(
        NotificationContext
      );
  
    if (!context) {
      throw new Error(
        'useNotifications must be used inside NotificationProvider.'
      );
    }
  
    return context;
  }