export type NotificationSeverity =
  | 'info'
  | 'success'
  | 'warning'
  | 'critical';

export type NotificationCategory =
  | 'metric'
  | 'report'
  | 'reminder'
  | 'system'
  | 'health-alert';

export type NotificationAction = {
  label: string;
  route: string;
};

export type VitalNotification = {
  id: string;

  title: string;
  message: string;

  severity: NotificationSeverity;
  category: NotificationCategory;

  read: boolean;

  createdAt: string;

  metricName?: string;
  metricValue?: string;

  action?: NotificationAction;
};

export type MetricEvaluation = {
  severity:
    | 'normal'
    | 'info'
    | 'warning'
    | 'critical';

  classification?: string;

  title?: string;
  message?: string;

  recommendation?: string;
};