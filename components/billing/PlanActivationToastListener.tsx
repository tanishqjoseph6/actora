"use client";

import { useEffect, useState } from "react";
import {
  PaymentToast,
  type PaymentToastState,
} from "@/components/billing/PaymentToast";

const STORAGE_KEY = "actora-plan-activated-toast";

export function PlanActivationToastListener() {
  const [toast, setToast] = useState<PaymentToastState>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    sessionStorage.removeItem(STORAGE_KEY);
    try {
      const parsed = JSON.parse(raw) as { title?: string; message?: string };
      setToast({
        type: "success",
        title: parsed.title ?? "Plan activated",
        message: parsed.message ?? "Your subscription has been updated.",
      });
    } catch {
      setToast({
        type: "success",
        title: "Plan activated",
        message: "Your subscription has been updated.",
      });
    }
  }, []);

  return <PaymentToast toast={toast} onDismiss={() => setToast(null)} />;
}

export function queuePlanActivationToast(title: string, message: string): void {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ title, message })
  );
}
