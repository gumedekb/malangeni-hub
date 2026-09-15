import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { EventDetail } from "@/components/events/EventDetail";

// `params` is a Promise in Next 16 — synchronous access was removed.
type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Event — Malangeni Hub",
  description: "Everything you need to know before you go.",
};

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  return (
    <Container as="main">
      <PageHead eyebrow="What's on" title="Event" description="Everything you need to know before you go." />
      <div className="pt-6">
        <EventDetail id={id} />
      </div>
    </Container>
  );
}
