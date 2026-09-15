import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { WelcomePanel } from "@/components/auth/WelcomePanel";

export const metadata: Metadata = {
  title: "Welcome — Malangeni Hub",
  description: "Tell us whether you're a community member or run a local business.",
};

export default function WelcomePage() {
  return (
    <Container as="main">
      <PageHead
        eyebrow="Welcome"
        title="How will you use the hub?"
        description="Members and local businesses both belong here."
      />
      <div className="pt-6">
        <WelcomePanel />
      </div>
    </Container>
  );
}
