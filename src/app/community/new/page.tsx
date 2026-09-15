import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { NewPost } from "@/components/posts/NewPost";

export const metadata: Metadata = {
  title: "Create a post — Malangeni Hub",
  description: "Share news, a notice, a job or a question with Malangeni.",
};

// `?group=<id>` (from a group's page) pre-picks that group.
type Props = { searchParams: Promise<{ group?: string | string[] }> };

export default async function NewPostPage({ searchParams }: Props) {
  const { group } = await searchParams;
  return (
    <Container as="main">
      <PageHead
        eyebrow="Community"
        title="Create a post"
        description="Share news, a notice, a job or a question with the community."
      />
      <div className="pt-6">
        <NewPost defaultGroupId={typeof group === "string" ? group : undefined} />
      </div>
    </Container>
  );
}
