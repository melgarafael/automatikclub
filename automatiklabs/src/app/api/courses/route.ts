import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch courses from Supabase
  return NextResponse.json({ courses: [] });
}
