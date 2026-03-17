import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const service = getServiceClient();
  const { data, error } = await service
    .from("invite_links")
    .select("id")
    .eq("code", code)
    .is("used_at", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ valid: false }, { status: 500 });
  }

  return NextResponse.json({ valid: Boolean(data) });
}
