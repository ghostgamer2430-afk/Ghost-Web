import { createFileRoute } from "@tanstack/react-router";
import EventsPage from "@/pages/Events";

export const Route = createFileRoute("/events")({
  component: EventsPage,
  head: () => ({
    meta: [
      { title: "Events Calendar — City of Fears" },
      { name: "description", content: "Upcoming events, dates, locations, and capacity." },
    ],
  }),
});
