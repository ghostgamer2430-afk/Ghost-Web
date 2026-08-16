import { createFileRoute } from "@tanstack/react-router";
import EventDetailsPage from "@/pages/EventDetails";

export const Route = createFileRoute("/event-details")({
  component: EventDetailsPage,
  head: () => ({
    meta: [
      { title: "Event Details — City of Fears" },
      { name: "description", content: "In-depth event view with RSVP and notes." },
    ],
  }),
});
