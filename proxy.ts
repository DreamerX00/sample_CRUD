import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const actionHeader = request.headers.get("next-action");

  // The app does not use Server Actions. Some clients/bots send malformed
  // Next-Action values like "x", which causes Next.js to throw internally.
  if (actionHeader === "x") {
    return NextResponse.json(
      { error: "Invalid Server Action request." },
      { status: 400 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
