import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toLocaleDateString("en-CA");

  const { data, error } = await supabase
    .from("food_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Allowlist accepted fields — prevent mass assignment
  const ALLOWED_FIELDS = [
    "name", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium",
    "serving_size", "date", "source_type", "ai_confidence", "ai_raw_response",
  ] as const;

  const insert: Record<string, unknown> = {
    user_id: user.id, // Always set server-side
    date: body.date || new Date().toLocaleDateString("en-CA"),
  };
  for (const key of ALLOWED_FIELDS) {
    if (key in body) insert[key] = body[key];
  }

  const { data, error } = await supabase
    .from("food_entries")
    .insert(insert)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Allowlist accepted fields — prevent mass assignment
  const ALLOWED_FIELDS = [
    "name", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium",
    "serving_size", "date", "source_type", "ai_confidence", "ai_raw_response",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("food_entries")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id) // RLS + explicit check
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("food_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
