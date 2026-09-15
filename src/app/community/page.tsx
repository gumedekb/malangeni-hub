import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHead } from "@/components/ui/PageHead";
import { Discussions } from "@/components/community/Discussions";
import { GroupsCard } from "@/components/community/GroupsCard";
import { NewMembers } from "@/components/community/NewMembers";
import { SidebarAd } from "@/components/community/SidebarAd";

export const metadata: Metadata = {
  title: "Community — Malangeni Hub",
  description: "Discussions, news, notices and jobs from people around Malangeni. Join a group and have your say.",
};

export default function CommunityPage() {
  return (
    <Container as="main">
      <PageHead
        eyebrow="Together"
        title="Community"
        description="Share notices, ask questions, and connect with people around Malangeni."
      />

      <div className="mt-[26px] grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_320px]">
        <Discussions />

        <aside className="flex flex-col gap-5 md:sticky md:top-[86px] [&>*]:min-w-[240px] max-md:flex-row max-md:flex-wrap max-sm:flex-col">
          <GroupsCard />
          <NewMembers />
          <SidebarAd />
        </aside>
      </div>
    </Container>
  );
}
