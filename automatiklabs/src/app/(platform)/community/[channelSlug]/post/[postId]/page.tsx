import { createClient } from "@/shared/lib/supabase/server";
import { getComments } from "@/features/comments/actions/get-comments";
import { PostCard } from "@/features/community/components/post-card";
import { CommentSection } from "@/features/comments/components/comment-section";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { PostWithAuthor } from "@/features/community/types";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ channelSlug: string; postId: string }>;
}) {
  const { channelSlug, postId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch full post with author and channel
  const { data: row, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:user_profiles!posts_author_id_fkey (
        id, full_name, username, role, avatar_url
      ),
      channel:channels!posts_channel_id_fkey (
        id, name, slug
      ),
      post_likes!left (
        user_id
      )
    `
    )
    .eq("id", postId)
    .eq("status", "published")
    .single();

  if (error || !row) {
    notFound();
  }

  const likes = (row.post_likes as Array<{ user_id: string }>) ?? [];
  const post: PostWithAuthor = {
    id: row.id as string,
    channel_id: row.channel_id as string,
    tab_id: row.tab_id as string | null,
    author_id: row.author_id as string,
    title: row.title as string | null,
    content_md: row.content_md as string,
    images: (row.images as string[]) ?? [],
    is_pinned: row.is_pinned as boolean,
    likes_count: row.likes_count as number,
    comments_count: row.comments_count as number,
    status: row.status as PostWithAuthor["status"],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: row.author as PostWithAuthor["author"],
    channel: row.channel as PostWithAuthor["channel"],
    user_has_liked: likes.some((l) => l.user_id === user?.id),
  };

  // Fetch comments
  const comments = await getComments("post", postId);

  return (
    <div className="py-5">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 font-mono text-[11px] text-text-3">
        <Link href="/feed" className="hover:text-text-2">
          Feed
        </Link>
        <span>/</span>
        <Link
          href={`/community/${channelSlug}`}
          className="hover:text-text-2"
        >
          #{channelSlug}
        </Link>
        <span>/</span>
        <span className="text-text-2">Post</span>
      </nav>

      {/* Full post (no truncation) */}
      <PostCard post={{ ...post, content_md: post.content_md }} />

      {/* Comment section */}
      <div className="mt-6">
        <CommentSection
          commentableType="post"
          commentableId={postId}
          comments={comments}
          count={post.comments_count}
        />
      </div>
    </div>
  );
}
