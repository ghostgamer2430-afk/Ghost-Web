import { createFileRoute } from "@tanstack/react-router";
import AdminSettingsPage from "@/pages/AdminSettings";

export const Route = createFileRoute("/admin-settings")({
  component: AdminSettingsPage,
  head: () => ({
    meta: [
      { title: "Admin Settings — City of Fears" },
      { name: "description", content: "Manage global configuration and site preferences." },
    ],
  }),
});
