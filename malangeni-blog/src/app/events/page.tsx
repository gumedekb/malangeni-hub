import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { EventsIndex } from "@/components/events/EventsIndex";

export const metadata: Metadata = {
  title: "Events — Malangeni Hub",
  description: "What's coming up around Malangeni.",
};

export default function EventsPage() {
  return (
    <Container as="main">
      <PageHead
        eyebrow="What's on"
        title="Events"
        description="Clean-ups, meetings, markets and fun — everything coming up around Malangeni."
      />
      <div className="pt-6">
        <EventsIndex />
      </div>
    </Container>
  );
}
