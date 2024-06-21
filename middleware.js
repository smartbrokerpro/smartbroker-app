import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  console.log(`Token: ${token}`);
  console.log(`Pathname: ${pathname}`);

  // Allow the requests if the following is true...
  // 1) It's a request for next-auth session & provider fetching
  // 2) It's a request to a public file like favicon.ico
  // 3) It's a request to the login page
  // 4) It's a request for static files like js, css, images, etc.
  if (
    pathname.includes("/api/auth") ||
    pathname === "/auth/sign-in" ||
    pathname.startsWith("/_next/") ||
    pathname.includes("/favicon.ico") ||
    pathname.startsWith("/images/") // Permitir acceso a imágenes
  ) {
    console.log("Allowing access to auth routes, sign-in page, or static files");
    return NextResponse.next();
  }

  if (token) {
    console.log("Token exists, allowing access");
    // Redirect to home if trying to access sign-in page while logged in
    if (pathname === "/auth/sign-in") {
      console.log("Redirecting to home because user is logged in");
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  console.log("No token, redirecting to sign-in");
  return NextResponse.redirect(new URL("/auth/sign-in", req.url));
}
