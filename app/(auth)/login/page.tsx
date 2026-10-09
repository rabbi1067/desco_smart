import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your DESCO SMART account to monitor your prepaid meters.",
};

export default function LoginPage() {
  // useSearchParams (redirectTo) requires a Suspense boundary during prerender.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
