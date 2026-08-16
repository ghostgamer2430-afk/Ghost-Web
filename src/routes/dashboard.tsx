import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "System Dashboard — City of Fears" },
      { name: "description", content: "System metrics, recent activity, and site status at a glance." },
    ],
  }),
});
