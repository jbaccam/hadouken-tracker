import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return user;
}

export async function GET() {
  const supabase = await createClient();
  const admin = await verifyAdmin(supabase);

  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Use service role to get all profiles with auth emails
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profiles, error: profilesError } = await serviceClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // Get user emails from auth.users
  const {
    data: { users },
    error: usersError,
  } = await serviceClient.auth.admin.listUsers();

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const emailMap = new Map(users.map((u) => [u.id, u.email]));

  const enriched = profiles?.map((p) => ({
    ...p,
    email: emailMap.get(p.id) || "unknown",
  }));

  return NextResponse.json(enriched);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const admin = await verifyAdmin(supabase);

  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { userId, role } = await request.json();

  if (!userId || !role) {
    return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
  }

  // Safety: can't set anyone to admin, can't change own role
  if (role === "admin") {
    return NextResponse.json({ error: "Cannot set admin role via API" }, { status: 400 });
  }

  if (userId === admin.id) {
    return NextResponse.json({ error: "Cannot change own role" }, { status: 400 });
  }

  if (role !== "friend" && role !== "free") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Use service role to bypass RLS
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await serviceClient
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
