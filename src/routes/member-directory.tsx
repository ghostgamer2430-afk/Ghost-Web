import { createFileRoute } from "@tanstack/react-router";
import MemberDirectoryPage from "@/pages/MemberDirectory";

export const Route = createFileRoute("/member-directory")({
  component: MemberDirectoryPage,
  head: () => ({
    meta: [
      { title: "Member Directory — City of Fears" },
      { name: "description", content: "Browse and manage all registered members." },
    ],
  }),
});
