import type { Metadata } from "next";
import { ReviewsView } from "@/components/marketing/reviews-view";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description:
    "Customer reviews for DESCO SMART. Reviews will appear here once collected — no fabricated testimonials are shown.",
};

export default function ReviewsPage() {
  return <ReviewsView />;
}
