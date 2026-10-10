import type { Metadata } from "next";
import { Suspense } from "react";
import { UnauthorizedView } from "@/components/shared/unauthorized-view";

export const metadata: Metadata = {
  title: "Access Denied",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <Suspense>
      <UnauthorizedView />
    </Suspense>
  );
}
