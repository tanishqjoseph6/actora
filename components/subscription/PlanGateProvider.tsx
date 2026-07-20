"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
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

type PlanGateState = {
  subscription: SubscriptionSnapshot | null;
  loading: boolean;
};

type PlanGateActions = {
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

type PlanGateContextValue = PlanGateState & PlanGateActions;

const PlanGateStateContext = createContext<PlanGateState | null>(null);
const PlanGateActionsContext = createContext<PlanGateActions | null>(null);

function resolveEffectivePlanId(
  subscriptionPlan: PlanId | undefined,
  sessionPlan: PlanId
): PlanId {
  if (!subscriptionPlan) return sessionPlan;
  if (
    (subscriptionPlan === "free" || subscriptionPlan === "trial") &&
    sessionPlan !== "free" &&
    sessionPlan !== "trial"
  ) {
    return sessionPlan;
  }
  if (subscriptionPlan === "free" && sessionPlan === "trial") {
    return "trial";
  }
  return subscriptionPlan;
}

export function PlanGateProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { subscription, loading, refresh } = useSubscription();
  const [limitModal, setLimitModal] = useState<LimitModalState>(null);

  const sessionPlanId =
    (session as { planId?: PlanId } | null)?.planId ?? "free";
  const effectivePlanId = resolveEffectivePlanId(
    subscription?.planId,
    sessionPlanId
  );

  const gateRef = useRef({
    subscription,
    loading,
    effectivePlanId,
  });
  gateRef.current = { subscription, loading, effectivePlanId };

  const showLimitModal = useCallback(
    (reason: string, limitType: LimitType, recommendedPlan?: PlanId) => {
      setLimitModal({
        reason,
        limitType,
        recommendedPlan:
          recommendedPlan ??
          getUpgradeRecommendation(
            gateRef.current.subscription?.planId ?? "free"
          ),
      });
    },
    []
  );

  const canAccessFeatureFn = useCallback(
    (feature: PlanFeature, planId?: PlanId) => {
      return hasPlanFeature(
        planId ?? gateRef.current.effectivePlanId,
        feature
      );
    },
    []
  );

  const checkAiAction = useCallback(() => {
    const { loading: isLoading, effectivePlanId: planId, subscription: sub } =
      gateRef.current;
    if (isLoading && planId === "free") return false;

    const usage = sub?.usage ?? {
      aiActionsUsed: 0,
      inboxesConnected: 0,
    };
    const gate = canUseAiAction(planId, usage);
    if (!gate.allowed) {
      showLimitModal(gate.reason, gate.limitType, gate.recommendedPlan);
      return false;
    }

    return true;
  }, [showLimitModal]);

  const checkInbox = useCallback(() => {
    const { loading: isLoading, effectivePlanId: planId, subscription: sub } =
      gateRef.current;
    if (isLoading && planId === "free") return false;

    const usage = sub?.usage ?? {
      aiActionsUsed: 0,
      inboxesConnected: 0,
    };
    const gate = canConnectInbox(planId, usage);
    if (!gate.allowed) {
      showLimitModal(gate.reason, gate.limitType, gate.recommendedPlan);
      return false;
    }

    return true;
  }, [showLimitModal]);

  const checkFeature = useCallback(
    (feature: PlanFeature) => {
      const { loading: isLoading, effectivePlanId: planId } = gateRef.current;
      if (isLoading && planId === "free") return false;

      const gate = checkFeatureAccess(planId, feature);
      if (!gate.allowed) {
        showLimitModal(gate.reason, gate.limitType, gate.recommendedPlan);
        return false;
      }

      return true;
    },
    [showLimitModal]
  );

  const state = useMemo(
    () => ({ subscription, loading }),
    [subscription, loading]
  );

  const actions = useMemo(
    () => ({
      refreshSubscription: refresh,
      checkAiAction,
      checkInbox,
      checkFeature,
      canAccessFeature: canAccessFeatureFn,
      showLimitModal,
    }),
    [
      refresh,
      checkAiAction,
      checkInbox,
      checkFeature,
      canAccessFeatureFn,
      showLimitModal,
    ]
  );

  return (
    <PlanGateActionsContext.Provider value={actions}>
      <PlanGateStateContext.Provider value={state}>
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
      </PlanGateStateContext.Provider>
    </PlanGateActionsContext.Provider>
  );
}

export function usePlanGate(): PlanGateContextValue {
  const state = useContext(PlanGateStateContext);
  const actions = useContext(PlanGateActionsContext);

  if (!state || !actions) {
    throw new Error("usePlanGate must be used within a PlanGateProvider");
  }

  return { ...state, ...actions };
}

/** Stable actions-only hook — avoids re-renders from subscription polling. */
export function usePlanGateActions(): PlanGateActions {
  const actions = useContext(PlanGateActionsContext);
  if (!actions) {
    throw new Error("usePlanGateActions must be used within a PlanGateProvider");
  }
  return actions;
}
