"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { MarkdownRenderer } from "@/shared/components/markdown-renderer";
import { formatRelativeTime } from "@/shared/utils/format-date";
import { PostActions } from "./post-actions";
import { CommentSection } from "@/features/comments/components/comment-section";
import type { PostWithAuthor } from "../types";
import type { UserRole } from "@/features/auth/types";

interface PostCardProps {
  post: PostWithAuthor;
}

function getRoleBadge(role: UserRole) {
  switch (role) {
    case "admin":
      return <Badge variant="admin">admin</Badge>;
    case "moderador":
      return <Badge variant="mod">mod</Badge>;
    case "contribuidor":
      return <Badge variant="contrib">&gt;_ contrib</Badge>;
    default:
      return null;
  }
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const isAiPost = post.author.role === "admin" && post.title?.toLowerCase().includes("ai");
  const isPinned = post.is_pinned;

  return (
    <article
      className={`group/post relative border-b border-border py-5 before:absolute before:-left-5 before:bottom-5 before:top-5 before:w-[3px] before:rounded-[1px] before:transition-[background] before:duration-[80ms] ${
        isPinned
          ? "before:bg-blue"
          : isAiPost
            ? "before:bg-violet"
            : "before:bg-transparent group-hover/post:before:bg-border"
      }`}
    >
      {isPinned && (
        <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-blue">
          Fixado
        </div>
      )}

      {/* Head: avatar + meta */}
      <div className="mb-[10px] flex items-center gap-[10px]">
        <Link href={post.author.username ? `/members/${post.author.username}` : "/members"}>
          <Avatar>
            {post.author.avatar_url ? (
              <AvatarImage
                src={post.author.avatar_url}
                alt={post.author.full_name}
              />
            ) : null}
            <AvatarFallback>
              {getInitials(post.author.full_name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={post.author.username ? `/members/${post.author.username}` : "/members"}
              className="font-display text-[14px] font-semibold text-text-1 hover:underline"
            >
              {post.author.full_name}
            </Link>
            {getRoleBadge(post.author.role)}
          </div>
          <div className="font-mono text-[11px] text-text-3">
            <span className="before:content-['\2192\0020']">
              {formatRelativeTime(new Date(post.created_at))}
              {" \u00B7 "}
              <Link
                href={`/community/${post.channel.slug}`}
                className="hover:text-text-2"
              >
                #{post.channel.name.toLowerCase().replace(/\s+/g, "-")}
              </Link>
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <Link href={`/community/${post.channel.slug}/post/${post.id}`}>
          <h3 className="mb-2 font-display text-[15px] font-semibold tracking-[-0.03em] text-text-1 hover:text-blue">
            {post.title}
          </h3>
        </Link>
      )}

      {/* Body */}
      <Link
        href={`/community/${post.channel.slug}/post/${post.id}`}
        className="block"
      >
        <MarkdownRenderer
          content={
            post.content_md.length > 500
              ? post.content_md.slice(0, 500) + "..."
              : post.content_md
          }
        />
      </Link>

      {/* Actions */}
      <PostActions
        postId={post.id}
        channelSlug={post.channel.slug}
        likesCount={post.likes_count}
        commentsCount={post.comments_count}
        userHasLiked={post.user_has_liked}
        onCommentClick={() => setShowComments(!showComments)}
      />

      {/* Inline comments */}
      {showComments && (
        <div className="mt-3 border-t border-border pt-3">
          <CommentSection
            commentableType="post"
            commentableId={post.id}
            comments={[]}
          />
        </div>
      )}
    </article>
  );
}

export default PostCard;
