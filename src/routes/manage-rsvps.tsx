import { createFileRoute } from "@tanstack/react-router";
import ManageRsvpsPage from "@/pages/ManageRsvps";

export const Route = createFileRoute("/manage-rsvps")({
  component: ManageRsvpsPage,
  head: () => ({
    meta: [
      { title: "Manage RSVPs — City of Fears" },
      { name: "description", content: "View and track all member RSVPs for events." },
    ],
  }),
});
