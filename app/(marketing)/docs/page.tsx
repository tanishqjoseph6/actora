import type { Metadata } from "next";
import { DeveloperPortal } from "@/components/developers/DeveloperPortal";

export const metadata: Metadata = {
  title: "Docs | Actora Developers",
  description: "Build with the Actora Public API and Roxx AI.",
};

export default function DocsPage() {
  return <DeveloperPortal docsOnly />;
}
