import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { PublicProfile } from "@/components/profile/PublicProfile";

// `params` is a Promise in Next 16 — synchronous access was removed.
type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — Malangeni Hub`,
    description: `Posts by ${username} on Malangeni Hub.`,
  };
}

export default async function MemberProfilePage({ params }: Props) {
  const { username } = await params;

  return (
    <Container as="main">
      <PageHead
        eyebrow="Member"
        title={username}
        description="Posts and activity from this member of the community."
      />
      <div className="pt-6">
        <PublicProfile username={username} />
      </div>
    </Container>
  );
}
