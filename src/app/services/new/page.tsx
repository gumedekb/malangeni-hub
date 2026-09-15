import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { SubmitService } from "@/components/services/SubmitService";

export const metadata: Metadata = {
  title: "Offer a service — Malangeni Hub",
  description: "List a service you offer so people around Malangeni can find you.",
};

export default function NewServicePage() {
  return (
    <Container as="main">
      <PageHead
        eyebrow="What we offer"
        title="Offer a service"
        description="Let people around Malangeni know what you can do for them."
      />
      <div className="pt-6">
        <SubmitService />
      </div>
    </Container>
  );
}
