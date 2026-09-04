import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/preview")({
  component: () => <Navigate to="/preview/$page" params={{ page: "home" }} replace />,
});
