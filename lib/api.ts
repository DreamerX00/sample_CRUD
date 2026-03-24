import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SessionPayload, sessionMaxAge, verifySessionToken } from "@/lib/auth";
import { ZodType } from "zod";

export const json = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

export class AppError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export const handleRouteError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return json({ error: error.message }, { status: error.status });
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    if (error.code === "42P01") {
      return json(
        {
          error:
            "Database tables are missing. Run `npm run db:setup` to create the required schema.",
        },
        { status: 500 },
      );
    }

    if (error.code === "3D000") {
      return json(
        {
          error:
            "The configured Postgres database does not exist. Check POSTGRES_DB or DATABASE_URL and create the database first.",
        },
        { status: 500 },
      );
    }

    if (error.code === "28P01") {
      return json(
        {
          error:
            "Postgres authentication failed. Check POSTGRES_USER, POSTGRES_PASSWORD, or DATABASE_URL.",
        },
        { status: 500 },
      );
    }
  }

  console.error(error);
  return json({ error: fallbackMessage }, { status: 500 });
};

export const parseJsonBody = async <T>(
  request: NextRequest,
  schema: ZodType<T>,
  invalidMessage: string,
) => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON.", 400);
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? invalidMessage, 400);
  }

  return parsed.data;
};

export const getSession = (request: NextRequest): SessionPayload | null => {
  const token = request.cookies.get(env.cookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
};

export const requireSession = (request: NextRequest) => {
  const session = getSession(request);

  if (!session) {
    return {
      error: json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  return { error: null, session };
};

export const assertUuid = (value: string, label: string) => {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(value)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

export const setSessionCookie = (response: NextResponse, token: string) => {
  response.cookies.set(env.cookieName, token, {
    httpOnly: true,
    maxAge: sessionMaxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set(env.cookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};
