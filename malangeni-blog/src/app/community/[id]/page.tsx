import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { postTypeLabel } from "@/lib/posts";
import { nameOf } from "@/lib/users";
import type { ApiPost } from "@/lib/types";
import { Container } from "@/components/layout/Container";
import { PostDetail } from "@/components/posts/PostDetail";

// `params` is a Promise in Next 16 — synchronous access was removed.
type Props = { params: Promise<{ id: string }> };

/**
 * The post, read on the server only for its title, text and picture, so a
 * shared link shows a proper preview on WhatsApp, Facebook and X. "missing"
 * means the backend said 404; null means it couldn't be reached.
 */
async function loadPost(id: string): Promise<ApiPost | "missing" | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/posts/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (res.status === 404) return "missing";
    if (!res.ok) return null;
    return (await res.json()) as ApiPost;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await loadPost(id);
  if (post === "missing") notFound();
  if (!post) {
    return { title: "Post — Malangeni Hub", description: "A post from the Malangeni community." };
  }

  const description = (post.body?.trim() || `${postTypeLabel(post.type)} by ${nameOf(post.author)}`).slice(0, 160);
  const images = post.imageUrl ? [{ url: post.imageUrl }] : undefined;
  return {
    title: `${post.title} — Malangeni Hub`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      siteName: "Malangeni Hub",
      url: `/community/${encodeURIComponent(id)}`,
      images,
    },
    twitter: {
      card: post.imageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.imageUrl ? [post.imageUrl] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  return (
    <Container as="main">
      <div className="pt-6">
        <PostDetail id={id} />
      </div>
    </Container>
  );
}
