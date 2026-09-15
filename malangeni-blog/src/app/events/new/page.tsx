import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { SubmitEvent } from "@/components/events/SubmitEvent";

export const metadata: Metadata = {
  title: "Submit an event — Malangeni Hub",
  description: "Tell the community about something that's happening.",
};

export default function NewEventPage() {
  return (
    <Container as="main">
      <PageHead
        eyebrow="What's on"
        title="Submit an event"
        description="Tell Malangeni about something that's happening."
      />
      <div className="pt-6">
        <SubmitEvent />
      </div>
    </Container>
  );
}
