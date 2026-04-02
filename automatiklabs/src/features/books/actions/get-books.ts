"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { Book } from "../types";

/**
 * Fetch books with optional tag filtering and search.
 */
export async function getBooks(options?: {
  tags?: string[];
  search?: string;
}): Promise<Book[]> {
  const supabase = await createClient();

  let query = supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.tags && options.tags.length > 0) {
    query = query.overlaps("tags", options.tags);
  }

  const { data: books, error } = await query;

  if (error || !books) return [];

  // Client-side search filtering for V1
  if (options?.search) {
    const q = options.search.toLowerCase();
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author_name?.toLowerCase().includes(q) ||
        book.description?.toLowerCase().includes(q)
    );
  }

  return books;
}

/**
 * Get all unique tags from books for filter UI.
 */
export async function getBookTags(): Promise<string[]> {
  const supabase = await createClient();

  const { data: books } = await supabase
    .from("books")
    .select("tags");

  if (!books) return [];

  const tagSet = new Set<string>();
  books.forEach((book) => {
    book.tags?.forEach((tag: string) => tagSet.add(tag));
  });

  return [...tagSet].sort();
}
