import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function createInviteCode() {
  return crypto.randomUUID().replace(/-/g, "");
}

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

  const service = getServiceClient();
  const { data, error } = await service
    .from("invite_links")
    .select("id, code, created_at, used_at")
    .eq("created_by", admin.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = await verifyAdmin(supabase);

  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { origin } = new URL(request.url);
  const service = getServiceClient();

  const code = createInviteCode();
  const { data, error } = await service
    .from("invite_links")
    .insert({
      code,
      created_by: admin.id,
    })
    .select("id, code, created_at, used_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    invite_url: `${origin}/auth?invite=${code}`,
  });
}
