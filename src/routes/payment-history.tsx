import { createFileRoute } from "@tanstack/react-router";
import PaymentHistoryPage from "@/pages/PaymentHistory";

export const Route = createFileRoute("/payment-history")({
  component: PaymentHistoryPage,
  head: () => ({
    meta: [
      { title: "Payment History — City of Fears" },
      { name: "description", content: "View payment statuses and membership fee history." },
    ],
  }),
});
