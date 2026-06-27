"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PlanLimitModal } from "@/components/subscription/PlanLimitModal";
import { useSubscription } from "@/hooks/useSubscription";
import {
  canConnectInbox,
  canUseAiAction,
  getUpgradeRecommendation,
  type LimitType,
  type SubscriptionSnapshot,
} from "@/lib/subscription";

type LimitModalState = {
  reason: string;
  limitType: LimitType;
} | null;

type PlanGateContextValue = {
  subscription: SubscriptionSnapshot | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  checkAiAction: () => boolean;
  checkInbox: () => boolean;
  showLimitModal: (reason: string, limitType: LimitType) => void;
};

const PlanGateContext = createContext<PlanGateContextValue | null>(null);

export function PlanGateProvider({ children }: { children: ReactNode }) {
  const { subscription, loading, refresh } = useSubscription();
  const [limitModal, setLimitModal] = useState<LimitModalState>(null);

  const showLimitModal = useCallback((reason: string, limitType: LimitType) => {
    setLimitModal({ reason, limitType });
  }, []);

  const checkAiAction = useCallback(() => {
    if (!subscription) return true;

    const gate = canUseAiAction(subscription.planId, subscription.usage);
    if (!gate.allowed) {
      showLimitModal(gate.reason, gate.limitType);
      return false;
    }

    return true;
  }, [subscription, showLimitModal]);

  const checkInbox = useCallback(() => {
    if (!subscription) return true;

    const gate = canConnectInbox(subscription.planId, subscription.usage);
    if (!gate.allowed) {
      showLimitModal(gate.reason, gate.limitType);
      return false;
    }

    return true;
  }, [subscription, showLimitModal]);

  const value = useMemo(
    () => ({
      subscription,
      loading,
      refreshSubscription: refresh,
      checkAiAction,
      checkInbox,
      showLimitModal,
    }),
    [subscription, loading, refresh, checkAiAction, checkInbox, showLimitModal]
  );

  const recommendedPlanId = subscription
    ? getUpgradeRecommendation(subscription.planId)
    : "starter";

  return (
    <PlanGateContext.Provider value={value}>
      {children}
      <PlanLimitModal
        isOpen={limitModal !== null}
        reason={limitModal?.reason ?? ""}
        limitType={limitModal?.limitType ?? "ai_actions"}
        currentPlanId={subscription?.planId ?? "free"}
        recommendedPlanId={recommendedPlanId}
        onClose={() => setLimitModal(null)}
      />
    </PlanGateContext.Provider>
  );
}

export function usePlanGate() {
  const context = useContext(PlanGateContext);

  if (!context) {
    throw new Error("usePlanGate must be used within a PlanGateProvider");
  }

  return context;
}
