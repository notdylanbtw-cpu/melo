import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/hire")({
  component: () => <Navigate to="/app/firm" replace />,
});
