import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const ryuDir = path.join(process.cwd(), "public", "sprites", "02_Ryu");
  const entries = await fs.readdir(ryuDir, { withFileTypes: true });

  const frames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
    .map((entry) => entry.name)
    .sort()
    .map((file) => `/sprites/02_Ryu/${file}`);

  return Response.json(frames);
}
