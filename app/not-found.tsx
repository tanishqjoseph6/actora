import Link from "next/link";
import { ErrorPage } from "@/components/errors/ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      variant="404"
      code="Error 404"
      title="Page Not Found"
      description="The page you're looking for doesn't exist or may have been moved. Check the URL or head back to your workspace."
      primaryAction={{ label: "Back to Home", href: "/" }}
      secondaryAction={{ label: "Go to Dashboard", href: "/dashboard" }}
      footer={
        <>
          Need help?{" "}
          <Link href="/login" className="text-[#3B82F6] hover:text-[#93C5FD] transition-colors">
            Contact support via sign-in
          </Link>
        </>
      }
    />
  );
}
