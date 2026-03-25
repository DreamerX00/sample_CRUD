import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signSessionToken } from "@/lib/auth";
import { handleRouteError, json, parseJsonBody, setSessionCookie } from "@/lib/api";
import { signupSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await parseJsonBody(
      request,
      signupSchema,
      "Invalid signup payload.",
    );
    const passwordHash = await hashPassword(password);

    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);

    if (existing.rowCount) {
      return json({ error: "That email is already in use." }, { status: 409 });
    }

    const { rows } = await db.query(
      `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email
      `,
      [name, email, passwordHash],
    );

    const user = rows[0];
    const response = json({ user });
    setSessionCookie(
      response,
      signSessionToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      }),
    );

    return response;
  } catch (error) {
    return handleRouteError(
      error,
      "Signup failed. Make sure Postgres is running and the schema has been applied.",
    );
  }
}
