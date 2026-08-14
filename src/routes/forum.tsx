import { createFileRoute } from "@tanstack/react-router";
import ForumPage from "@/pages/Forum";

export const Route = createFileRoute("/forum")({
  component: ForumPage,
  head: () => ({ meta: [{ title: "Forum — City of Fears" }] }),
});
