"use server";

// Canonical implementation lives in features/comments.
// Re-export to avoid breaking imports from community feature.
export { createComment } from "@/features/comments/actions/create-comment";
export type { CreateCommentState } from "@/features/comments/types";
