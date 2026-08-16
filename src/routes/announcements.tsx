import { createFileRoute } from "@tanstack/react-router";
import AnnouncementsPage from "@/pages/Announcements";

export const Route = createFileRoute("/announcements")({
  component: AnnouncementsPage,
  head: () => ({
    meta: [
      { title: "Announcements — City of Fears" },
      { name: "description", content: "Official announcements and pinned posts." },
    ],
  }),
});
