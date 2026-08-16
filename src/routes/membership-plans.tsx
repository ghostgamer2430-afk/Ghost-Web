import { createFileRoute } from "@tanstack/react-router";
import MembershipPlansPage from "@/pages/MembershipPlans";

export const Route = createFileRoute("/membership-plans")({
  component: MembershipPlansPage,
  head: () => ({
    meta: [
      { title: "Membership Plans — City of Fears" },
      { name: "description", content: "Explore membership tiers, benefits, and pricing." },
    ],
  }),
});
