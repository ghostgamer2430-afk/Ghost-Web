import { createFileRoute } from "@tanstack/react-router";
import UserProfilePage from "@/pages/UserProfile";

export const Route = createFileRoute("/user-profile")({
  component: UserProfilePage,
  head: () => ({
    meta: [
      { title: "User Profile — City of Fears" },
      { name: "description", content: "View and update your personal information and security settings." },
    ],
  }),
});
