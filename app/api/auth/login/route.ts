import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { signSessionToken, verifyPassword } from "@/lib/auth";
import { handleRouteError, json, parseJsonBody, setSessionCookie } from "@/lib/api";
import { loginSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await parseJsonBody(request, loginSchema, "Invalid login payload.");
    const { rows } = await db.query(
      `
        SELECT id, name, email, password_hash AS "passwordHash"
        FROM users
        WHERE email = $1
      `,
      [email],
    );

    const user = rows[0];

    if (!user) {
      return json({ error: "No account exists for that email." }, { status: 404 });
    }

    const matches = await verifyPassword(password, user.passwordHash);

    if (!matches) {
      return json({ error: "Incorrect password." }, { status: 401 });
    }

    const response = json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

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
    return handleRouteError(error, "Login failed. Check your database connection.");
  }
}
