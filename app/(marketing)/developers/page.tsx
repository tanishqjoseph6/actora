import type { Metadata } from "next";
import { DeveloperPortal } from "@/components/developers/DeveloperPortal";

export const metadata: Metadata = {
  title: "Developers | Actora",
  description: "API keys, SDKs, webhooks, playground, and developer tools for Actora.",
};

export default function DevelopersPage() {
  return <DeveloperPortal />;
}
