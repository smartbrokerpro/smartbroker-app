import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (
    pathname.includes("/api/auth") ||
    pathname === "/auth/sign-in" ||
    pathname.startsWith("/_next/") ||
    pathname.includes("/favicon.ico") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/api/projects") ||
    pathname.startsWith("/api/gpt/projects-gpt-handler") || 
    pathname.startsWith("/api/gpt/[model]-gpt-handler")
  ) {
    return NextResponse.next();
  }

  if (token) {
    if (pathname === "/auth/sign-in") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/auth/sign-in", req.url));
}
