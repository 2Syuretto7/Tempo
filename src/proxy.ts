import { NextResponse, type NextRequest } from "next/server";

/** A cheap gate: no session cookie, no Tempo. Pages and APIs still verify the session. */
export function proxy(request: NextRequest) {
  if (request.cookies.has("tempo_session")) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/sign-in", request.url));
}

export const config = {
  matcher: ["/((?!sign-in|_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
