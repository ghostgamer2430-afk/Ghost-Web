import { createFileRoute } from "@tanstack/react-router";
import ActivityLogsPage from "@/pages/ActivityLogs";

export const Route = createFileRoute("/activity-logs")({
  component: ActivityLogsPage,
  head: () => ({
    meta: [
      { title: "Activity Logs — City of Fears" },
      { name: "description", content: "Track database changes and system events." },
    ],
  }),
});
