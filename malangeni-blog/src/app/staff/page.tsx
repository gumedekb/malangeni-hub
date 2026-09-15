import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { StaffPanel } from "@/components/staff/StaffPanel";

export const metadata: Metadata = {
  title: "Hub team — Malangeni Hub",
  description: "Business verification and team management.",
};

export default function StaffPage() {
  return (
    <Container as="main">
      <PageHead
        eyebrow="Hub team"
        title="Team tools"
        description="Confirm local businesses and manage who helps run the hub."
      />
      <div className="pt-6">
        <StaffPanel />
      </div>
    </Container>
  );
}
