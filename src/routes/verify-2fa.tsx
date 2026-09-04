import { createFileRoute } from "@tanstack/react-router";
import { VerifyTwoFactorPage } from "@/features/auth/verify-2fa";

export const Route = createFileRoute("/verify-2fa")({
  component: VerifyTwoFactorPage,
});
