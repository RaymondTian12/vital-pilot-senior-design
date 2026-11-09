import { createContext, useContext } from "react";

// Keep the shared header independent of notification overlays, which themselves
// use the design system. This avoids a UI ↔ notification-provider import cycle.
export const NotificationCountContext = createContext(0);
export function useNotificationCount() {
  return useContext(NotificationCountContext);
}
