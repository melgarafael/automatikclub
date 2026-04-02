import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lesson_id, progress_percentage } = body;

    if (!lesson_id || progress_percentage === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing lesson_id or progress_percentage" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const percentage = Math.max(0, Math.min(100, Math.round(progress_percentage)));

    // Check current progress for monotonic update
    const { data: current } = await supabase
      .from("user_lesson_progress")
      .select("progress_percentage, is_completed")
      .eq("user_id", user.id)
      .eq("lesson_id", lesson_id)
      .single();

    // Don't regress
    if (current?.is_completed) {
      return NextResponse.json({ success: true });
    }
    if (current && current.progress_percentage >= percentage) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("user_lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id,
        progress_percentage: percentage,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
