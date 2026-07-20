"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PaymentToast,
  type PaymentToastState,
  type PaymentToastType,
} from "@/components/billing/PaymentToast";

type ToastInput = {
  type: PaymentToastType;
  title: string;
  message: string;
};

type ToastContextValue = {
  toast: PaymentToastState;
  showToast: (toast: ToastInput) => void;
  dismissToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<PaymentToastState>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((next: ToastInput) => {
    setToast(next);
  }, []);

  const value = useMemo(
    () => ({ toast, showToast, dismissToast }),
    [toast, showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <PaymentToast toast={toast} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

/** Safe optional toast when provider may be absent (e.g. outside dashboard). */
export function useOptionalToast() {
  return useContext(ToastContext);
}
