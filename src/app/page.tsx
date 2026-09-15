import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { FeaturedPlace } from "@/components/home/FeaturedPlace";
import { EventsList } from "@/components/home/EventsList";
import { CommunityFeed } from "@/components/home/CommunityFeed";
import { SponsorStrip } from "@/components/ui/SponsorStrip";

export const metadata: Metadata = {
  title: "Malangeni Hub — news, events and services in Malangeni",
  description:
    "What's happening around Malangeni: community news and notices, local jobs, upcoming events, places and services.",
};

export default function HomePage() {
  return (
    <Container as="main">
      <section className="pb-2 pt-[38px]">
        <h1 className="font-serif text-[34px] font-semibold tracking-[-0.5px] sm:text-[46px]">Welcome</h1>
        <p className="mt-1 text-[15px] text-muted">What&apos;s happening around Malangeni today.</p>
      </section>

      <section className="mt-[22px] grid grid-cols-1 gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <FeaturedPlace />
        <EventsList />
      </section>

      <SponsorStrip pitch="Your ad could be here — partner with Malangeni Hub" />

      <CommunityFeed />
    </Container>
  );
}
