import { clearSessionCookie, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = json({ ok: true });
  clearSessionCookie(response);
  return response;
}
