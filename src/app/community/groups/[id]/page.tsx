import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { GroupDetail } from "@/components/community/GroupDetail";

// `params` is a Promise in Next 16 — synchronous access was removed.
type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Group — Malangeni Hub",
  description: "People around Malangeni who share an interest.",
};

export default async function GroupPage({ params }: Props) {
  const { id } = await params;
  return (
    <Container as="main">
      <PageHead
        eyebrow="Together"
        title="Group"
        description="People around Malangeni who share an interest."
      />
      <div className="pt-6">
        <GroupDetail id={id} />
      </div>
    </Container>
  );
}
