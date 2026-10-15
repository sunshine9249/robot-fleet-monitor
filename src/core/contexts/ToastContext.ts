import React from "react";
import { useToast } from "../hooks/useToast";

export const ToastContext = React.createContext<ReturnType<typeof useToast>>({
  toasts: [],
  addToast: () => {},
  setToasts: () => {},
  addAlertToast: () => {},
  handleDismiss: () => {},
  clearAllToasts: () => {},
  alertsEnabled: true,
  setAlertsEnabled: () => {},
});
