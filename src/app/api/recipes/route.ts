import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const nutritionItemSchema = z
  .object({
    name: z.string().trim().min(1),
    serving_size: z.string().trim().min(1),
    calories: z.number().finite().min(0),
    protein: z.number().finite().min(0),
    carbs: z.number().finite().min(0),
    fat: z.number().finite().min(0),
    fiber: z.number().finite().min(0).nullable(),
    sugar: z.number().finite().min(0).nullable(),
    sodium: z.number().finite().min(0).nullable(),
  })
  .strict();

const createRecipeSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    items: z.array(nutritionItemSchema).min(1),
    total_weight_grams: z.number().finite().positive().nullable().optional(),
    servings: z.number().finite().positive(),
  })
  .strict();

const updateRecipeSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(120).optional(),
    items: z.array(nutritionItemSchema).min(1).optional(),
    total_weight_grams: z.number().finite().positive().nullable().optional(),
    servings: z.number().finite().positive().optional(),
  })
  .strict();

function mapDbErrorMessage(error: unknown): string {
  const dbError = error as { code?: string; message?: string };
  if (dbError?.code === "42P01") {
    return "saved_recipes table not found. Run the SQL migration first.";
  }
  return dbError?.message || "Database error";
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: mapDbErrorMessage(error) }, { status: 500 });
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
  const parsed = createRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recipe payload" }, { status: 400 });
  }

  const insert = {
    user_id: user.id,
    ...parsed.data,
    total_weight_grams: parsed.data.total_weight_grams ?? null,
  };

  const { data, error } = await supabase
    .from("saved_recipes")
    .insert(insert)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: mapDbErrorMessage(error) }, { status: 500 });
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
  const parsed = updateRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recipe payload" }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;

  const { data, error } = await supabase
    .from("saved_recipes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: mapDbErrorMessage(error) }, { status: 500 });
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
    .from("saved_recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: mapDbErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
