import type { Metadata } from "next";
import { UnauthorizedView } from "@/components/shared/unauthorized-view";

export const metadata: Metadata = {
  title: "Access Denied",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return <UnauthorizedView />;
}
