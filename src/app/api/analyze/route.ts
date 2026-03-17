import { createClient } from "@/lib/supabase/server";
import { analyzeImage } from "@/lib/openai/analyze-image";
import { analyzeText } from "@/lib/openai/analyze-text";
import { NextResponse } from "next/server";

const MAX_AI_REQUESTS_PER_DAY = 30;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, ai_requests_today, ai_requests_date")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "friend")) {
    return NextResponse.json(
      { error: "AI features require admin or friend role" },
      { status: 403 }
    );
  }

  // 3. Check rate limit (reset if new day)
  const today = new Date().toISOString().split("T")[0];
  let requestsToday = profile.ai_requests_today;

  if (profile.ai_requests_date !== today) {
    requestsToday = 0;
  }

  if (requestsToday >= MAX_AI_REQUESTS_PER_DAY) {
    return NextResponse.json(
      { error: `Daily AI limit reached (${MAX_AI_REQUESTS_PER_DAY}/day)` },
      { status: 429 }
    );
  }

  // 4. Validate request body
  const body = await request.json();
  const { type, content } = body;

  if (!type || !content) {
    return NextResponse.json({ error: "Missing type or content" }, { status: 400 });
  }

  if (type !== "image" && type !== "text") {
    return NextResponse.json({ error: "Type must be 'image' or 'text'" }, { status: 400 });
  }

  // Image size check (rough base64 size estimation)
  if (type === "image") {
    const sizeEstimate = (content.length * 3) / 4;
    if (sizeEstimate > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image too large (max 4MB)" }, { status: 400 });
    }
  }

  // 5. Route to analyzer, then increment on success
  try {
    const result =
      type === "image"
        ? await analyzeImage(content)
        : await analyzeText(content);

    // Increment counter AFTER successful analysis — don't burn quota on failures
    await supabase
      .from("profiles")
      .update({
        ai_requests_today: requestsToday + 1,
        ai_requests_date: today,
      })
      .eq("id", user.id);

    return NextResponse.json(result);
  } catch (err) {
    console.error("AI analysis error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
