"use client";

import { PaymentToast, type PaymentToastState } from "@/components/billing/PaymentToast";

type AppToastProps = {
  toast: PaymentToastState;
  onDismiss: () => void;
};

/** Reuses the premium toast UI across billing and inbox flows. */
export function AppToast({ toast, onDismiss }: AppToastProps) {
  return <PaymentToast toast={toast} onDismiss={onDismiss} />;
}

export type { PaymentToastState as AppToastState } from "@/components/billing/PaymentToast";
