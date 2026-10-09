import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Choose a new password for your DESCO SMART account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
