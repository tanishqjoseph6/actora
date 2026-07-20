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

type ToastActionsValue = {
  showToast: (toast: ToastInput) => void;
  dismissToast: () => void;
};

const ToastStateContext = createContext<PaymentToastState>(null);
const ToastActionsContext = createContext<ToastActionsValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<PaymentToastState>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((next: ToastInput) => {
    setToast(next);
  }, []);

  const actions = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast]
  );

  return (
    <ToastActionsContext.Provider value={actions}>
      <ToastStateContext.Provider value={toast}>
        {children}
        <PaymentToast toast={toast} onDismiss={dismissToast} />
      </ToastStateContext.Provider>
    </ToastActionsContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastStateContext);
  const actions = useContext(ToastActionsContext);
  if (!actions) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return { toast, ...actions };
}

/** Safe optional toast when provider may be absent (e.g. outside dashboard). */
export function useOptionalToast() {
  const toast = useContext(ToastStateContext);
  const actions = useContext(ToastActionsContext);
  if (!actions) return null;
  return { toast, ...actions };
}
