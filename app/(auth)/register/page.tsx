import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a DESCO SMART account to monitor multiple prepaid meters and receive automated low-balance alerts.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
