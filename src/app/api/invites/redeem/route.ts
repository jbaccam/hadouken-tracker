import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing invite code" }, { status: 400 });
  }

  const service = getServiceClient();

  const { data: redeemed, error: redeemError } = await service
    .from("invite_links")
    .update({
      used_at: new Date().toISOString(),
      used_by: user.id,
    })
    .eq("code", code)
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  if (redeemError) {
    return NextResponse.json({ error: redeemError.message }, { status: 500 });
  }

  if (!redeemed) {
    return NextResponse.json({ error: "Invite link is invalid or already used" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    const { error: upsertError } = await service.from("profiles").upsert({
      id: user.id,
      role: "friend",
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  } else if (profile.role === "free") {
    const { error: updateError } = await service
      .from("profiles")
      .update({ role: "friend", updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
