import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = getSession(request);

  if (!session) {
    return json({ user: null });
  }

  const { rows } = await db.query(
    `
      SELECT id, name, email, role
      FROM users
      WHERE id = $1
    `,
    [session.userId],
  );

  return json({ user: rows[0] ?? null });
}
