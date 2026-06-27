"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import type { BillingPeriod } from "@/components/billing/pricing-data";
import type { PlanId } from "@/lib/subscription";
import type { RazorpayPaymentResponse } from "@/types/razorpay";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay."))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay."));
    document.body.appendChild(script);
  });
}

type CheckoutCallbacks = {
  onSuccess?: (planId: PlanId, planName: string) => void;
  onFailure?: (message: string) => void;
  onCancel?: () => void;
};

export function useRazorpayCheckout(callbacks?: CheckoutCallbacks) {
  const { data: session } = useSession();
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const openCheckout = useCallback(
    async (planId: PlanId, period: BillingPeriod) => {
      try {
        const orderRes = await fetch("/api/payments/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, period }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          callbacksRef.current?.onFailure?.(
            orderData.error ?? "Failed to start checkout."
          );
          return false;
        }

        await loadRazorpayScript();

        if (!window.Razorpay) {
          callbacksRef.current?.onFailure?.("Razorpay failed to initialize.");
          return false;
        }

        return await new Promise<boolean>((resolve) => {
          const rzp = new window.Razorpay!({
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Actora",
            description: orderData.description,
            order_id: orderData.orderId,
            prefill: {
              name: session?.user?.name,
              email: session?.user?.email,
            },
            theme: { color: "#00CFFF" },
            handler: async (response: RazorpayPaymentResponse) => {
              try {
                const verifyRes = await fetch(
                  "/api/payments/razorpay/verify",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...response,
                      planId,
                      period,
                    }),
                  }
                );

                const verifyData = await verifyRes.json();

                if (!verifyRes.ok) {
                  callbacksRef.current?.onFailure?.(
                    verifyData.error ?? "Payment verification failed."
                  );
                  resolve(false);
                  return;
                }

                const planName =
                  verifyData.subscription?.planName ?? planId;
                callbacksRef.current?.onSuccess?.(planId, planName);
                resolve(true);
              } catch {
                callbacksRef.current?.onFailure?.("Payment verification failed.");
                resolve(false);
              }
            },
            modal: {
              ondismiss: () => {
                callbacksRef.current?.onCancel?.();
                resolve(false);
              },
            },
          });

          rzp.on("payment.failed", (response) => {
            callbacksRef.current?.onFailure?.(
              response.error.description ?? "Payment failed."
            );
            resolve(false);
          });

          rzp.open();
        });
      } catch (error) {
        callbacksRef.current?.onFailure?.(
          error instanceof Error
            ? error.message
            : "Failed to open checkout."
        );
        return false;
      }
    },
    [session]
  );

  return { openCheckout };
}
