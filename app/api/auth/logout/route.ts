import { clearSessionCookie, json } from "@/lib/api";

export async function POST() {
  const response = json({ ok: true });
  clearSessionCookie(response);
  return response;
}
