import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { ProfilePanel } from "@/components/profile/ProfilePanel";

export const metadata: Metadata = {
  title: "Your profile — Malangeni Hub",
  description: "Change your username and profile picture.",
};

export default function ProfilePage() {
  return (
    <Container as="main">
      <PageHead
        eyebrow="Your account"
        title="Profile"
        description="Change how you appear to the rest of the community."
      />
      <div className="pt-6">
        <ProfilePanel />
      </div>
    </Container>
  );
}
