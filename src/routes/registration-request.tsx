import { createFileRoute } from "@tanstack/react-router";
import RegistrationRequestPage from "@/pages/RegistrationRequest";

export const Route = createFileRoute("/registration-request")({
  component: RegistrationRequestPage,
  head: () => ({
    meta: [
      { title: "Registration Request — City of Fears" },
      { name: "description", content: "Submit a request to join the club." },
    ],
  }),
});
