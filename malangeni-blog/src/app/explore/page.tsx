import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { ExploreDirectory } from "@/components/explore/ExploreDirectory";
import { SponsorStrip } from "@/components/ui/SponsorStrip";
import { LocalBusinesses } from "@/components/explore/LocalBusinesses";

export const metadata: Metadata = {
  title: "Explore — Malangeni Hub",
  description: "Places, spaces and local businesses around Malangeni — with opening hours and how to reach them.",
};

export default function ExplorePage() {
  return (
    <Container as="main">
      <PageHead
        eyebrow="Discover"
        title="Explore"
        description="Find places, spaces and points of interest around Malangeni."
      />
      <ExploreDirectory />
      <LocalBusinesses />
      <SponsorStrip pitch="Promote your place to the whole community" />
    </Container>
  );
}
