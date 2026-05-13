import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

type SessionRole = "SUPERVISOR" | "AGENT";

const jwt = process.env.JWT_SECRET!;
const sessionCookieName = "collecta_session";

function redirect(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function entryForRole(role: SessionRole) {
  return role === "SUPERVISOR" ? "/admin" : "/agent";
}

async function fetchSessionRole(token?: string): Promise<SessionRole | null> {
  try {
    if (!token) return null;

    const encodedSecret = new TextEncoder().encode(jwt);

    const { payload } = await jwtVerify(token, encodedSecret);

    const role = payload.role;

    if (role === "SUPERVISOR" || role === "AGENT") {
      return role as SessionRole;
    }

    return null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(sessionCookieName)?.value;
  const role = await fetchSessionRole(token);

  if (!role) {
    if (pathname === "/login") {
      return NextResponse.next();
    }

    return redirect(request, "/login");
  }

  const entry = entryForRole(role);

  if (pathname === "/" || pathname === "/login") {
    return redirect(request, entry);
  }

  if (pathname.startsWith("/admin") && role !== "SUPERVISOR") {
    return redirect(request, entry);
  }

  if (pathname.startsWith("/agent") && role !== "AGENT") {
    return redirect(request, entry);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/agent/:path*"],
};
