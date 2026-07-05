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
  canAccessFeature as checkFeatureAccess,
  canConnectInbox,
  canUseAiAction,
  getUpgradeRecommendation,
  hasPlanFeature,
  type LimitType,
  type PlanFeature,
  type PlanId,
  type SubscriptionSnapshot,
} from "@/lib/subscription";

type LimitModalState = {
  reason: string;
  limitType: LimitType;
  recommendedPlan: PlanId;
} | null;

type PlanGateContextValue = {
  subscription: SubscriptionSnapshot | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  checkAiAction: () => boolean;
  checkInbox: () => boolean;
  checkFeature: (feature: PlanFeature) => boolean;
  canAccessFeature: (feature: PlanFeature, planId?: PlanId) => boolean;
  showLimitModal: (
    reason: string,
    limitType: LimitType,
    recommendedPlan?: PlanId
  ) => void;
};

const PlanGateContext = createContext<PlanGateContextValue | null>(null);

export function PlanGateProvider({ children }: { children: ReactNode }) {
  const { subscription, loading, refresh } = useSubscription();
  const [limitModal, setLimitModal] = useState<LimitModalState>(null);

  const showLimitModal = useCallback(
    (reason: string, limitType: LimitType, recommendedPlan?: PlanId) => {
      setLimitModal({
        reason,
        limitType,
        recommendedPlan:
          recommendedPlan ??
          getUpgradeRecommendation(subscription?.planId ?? "free"),
      });
    },
    [subscription?.planId]
  );

  const canAccessFeatureFn = useCallback(
    (feature: PlanFeature, planId?: PlanId) => {
      return hasPlanFeature(planId ?? subscription?.planId ?? "free", feature);
    },
    [subscription?.planId]
  );

  const checkAiAction = useCallback(() => {
    if (!subscription) return true;

    const gate = canUseAiAction(subscription.planId, subscription.usage);
    if (!gate.allowed) {
      showLimitModal(gate.reason, gate.limitType, gate.recommendedPlan);
      return false;
    }

    return true;
  }, [subscription, showLimitModal]);

  const checkInbox = useCallback(() => {
    if (!subscription) return true;

    const gate = canConnectInbox(subscription.planId, subscription.usage);
    if (!gate.allowed) {
      showLimitModal(gate.reason, gate.limitType, gate.recommendedPlan);
      return false;
    }

    return true;
  }, [subscription, showLimitModal]);

  const checkFeature = useCallback(
    (feature: PlanFeature) => {
      if (!subscription) return true;

      const gate = checkFeatureAccess(subscription.planId, feature);
      if (!gate.allowed) {
        showLimitModal(gate.reason, gate.limitType, gate.recommendedPlan);
        return false;
      }

      return true;
    },
    [subscription, showLimitModal]
  );

  const value = useMemo(
    () => ({
      subscription,
      loading,
      refreshSubscription: refresh,
      checkAiAction,
      checkInbox,
      checkFeature,
      canAccessFeature: canAccessFeatureFn,
      showLimitModal,
    }),
    [
      subscription,
      loading,
      refresh,
      checkAiAction,
      checkInbox,
      checkFeature,
      canAccessFeatureFn,
      showLimitModal,
    ]
  );

  return (
    <PlanGateContext.Provider value={value}>
      {children}
      <PlanLimitModal
        isOpen={limitModal !== null}
        reason={limitModal?.reason ?? ""}
        limitType={limitModal?.limitType ?? "ai_actions"}
        currentPlanId={subscription?.planId ?? "free"}
        recommendedPlanId={
          limitModal?.recommendedPlan ??
          getUpgradeRecommendation(subscription?.planId ?? "free")
        }
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
