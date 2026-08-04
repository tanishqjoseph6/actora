"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ComponentErrorBoundaryProps = {
  name: string;
  children: ReactNode;
  className?: string;
};

type ComponentErrorBoundaryState = {
  hasError: boolean;
};

export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  state: ComponentErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ComponentErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[dashboard-render] ${this.props.name} failed`, {
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    console.debug(`[dashboard-render] rendering ${this.props.name}`);

    if (this.state.hasError) {
      return (
        <div
          className={`rounded-2xl border border-white/[0.06] bg-[#111111]/70 p-5 text-sm text-[#A1A1AA] ${this.props.className ?? ""}`}
          role="status"
        >
          This section is temporarily unavailable.
        </div>
      );
    }

    return this.props.children;
  }
}
