import { useCallback, useEffect, useState } from "react";
import { api, POST_ENDPOINTS, type PostQuery } from "./api";
import { useAuth } from "./auth/AuthContext";
import type { ApiPost, Page } from "./types";

type Filters = Omit<PostQuery, "page" | "size">;

interface FeedState {
  /** Which request this state belongs to; stale state is ignored rather than cleared. */
  key: string;
  posts: ApiPost[];
  page: number;
  last: boolean;
  total: number;
  error: string | null;
}

const EMPTY: FeedState = { key: "", posts: [], page: 0, last: true, total: 0, error: null };

function message(err: unknown): string {
  return err instanceof Error ? err.message : "Could not load posts.";
}

/**
 * A paginated list of posts, newest first, plus helpers that keep it in step
 * after a like, edit, delete or new post. Re-fetches when the filters change or
 * someone signs in or out, since `likedByCurrentUser` depends on who asks.
 */
export function usePostFeed(filters: Filters, { size = 10, enabled = true } = {}) {
  const { profile } = useAuth();
  const [nonce, setNonce] = useState(0);
  const [feed, setFeed] = useState<FeedState>(EMPTY);
  const [loadingMore, setLoadingMore] = useState(false);

  // Everything a request depends on, as one comparable value.
  const key = JSON.stringify({ filters, size, viewer: profile ? String(profile.id) : null, nonce });

  useEffect(() => {
    if (!enabled) return;
    const { filters: f, size: s } = JSON.parse(key) as { filters: Filters; size: number };
    let cancelled = false;
    void (async () => {
      try {
        const page = await api.get<Page<ApiPost>>(POST_ENDPOINTS.list({ ...f, page: 0, size: s }));
        if (cancelled) return;
        setFeed({
          key,
          posts: page?.content ?? [],
          page: 0,
          last: page?.last ?? true,
          total: page?.totalElements ?? 0,
          error: null,
        });
      } catch (err) {
        if (!cancelled) setFeed({ ...EMPTY, key, error: message(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, enabled]);

  const current = feed.key === key ? feed : null;

  const loadMore = useCallback(async () => {
    if (!current || current.last || loadingMore) return;
    const { filters: f, size: s } = JSON.parse(key) as { filters: Filters; size: number };
    setLoadingMore(true);
    try {
      const next = await api.get<Page<ApiPost>>(
        POST_ENDPOINTS.list({ ...f, page: current.page + 1, size: s }),
      );
      setFeed((prev) => {
        if (prev.key !== key) return prev;
        // New posts shift the pages, so drop anything already on screen.
        const seen = new Set(prev.posts.map((p) => p.id));
        return {
          ...prev,
          posts: [...prev.posts, ...(next?.content ?? []).filter((p) => !seen.has(p.id))],
          page: prev.page + 1,
          last: next?.last ?? true,
          total: next?.totalElements ?? prev.total,
        };
      });
    } catch (err) {
      setFeed((prev) => (prev.key === key ? { ...prev, error: message(err) } : prev));
    } finally {
      setLoadingMore(false);
    }
  }, [current, key, loadingMore]);

  const update = useCallback((post: ApiPost) => {
    setFeed((prev) => ({ ...prev, posts: prev.posts.map((p) => (p.id === post.id ? post : p)) }));
  }, []);

  const remove = useCallback((id: string) => {
    setFeed((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== id),
      total: Math.max(0, prev.total - 1),
    }));
  }, []);

  const prepend = useCallback((post: ApiPost) => {
    setFeed((prev) => ({
      ...prev,
      posts: [post, ...prev.posts.filter((p) => p.id !== post.id)],
      total: prev.total + 1,
    }));
  }, []);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    posts: current?.posts ?? [],
    loading: enabled && !current,
    error: current?.error ?? null,
    hasMore: !!current && !current.last,
    total: current?.total ?? 0,
    loadingMore,
    loadMore,
    update,
    remove,
    prepend,
    reload,
  };
}
