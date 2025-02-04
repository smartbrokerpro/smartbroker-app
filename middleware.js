import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { hasPermission } from '@/lib/auth/permissions';

export async function middleware(req) {
  const { pathname, searchParams } = req.nextUrl;
  const userAgent = req.headers.get("user-agent") || "";
  const bypassToken = req.headers.get("x-vercel-protection-bypass") || searchParams.get("x-vercel-protection-bypass");

  console.log('\n--- Middleware Debug ---');
  console.log('Pathname:', pathname);
  console.log('User-Agent:', userAgent);
  console.log('Bypass Token:', bypassToken);

  // Permitir acceso si el request proviene del cron job de Vercel con el bypass token
  if (bypassToken === process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    console.log("Bypass token válido, permitiendo acceso.");
    return NextResponse.next();
  }

  // Permitir acceso sin autenticación si la solicitud proviene de Vercel Cron
  if (userAgent.toLowerCase().includes("vercel-cron")) {
    console.log("Solicitud desde Vercel Cron detectada, permitiendo acceso.");
    return NextResponse.next();
  }

  // Rutas públicas
  if (
    pathname.startsWith("/api/updateUF") || 
    pathname.includes("/api/auth") ||
    pathname === "/auth/sign-in" ||
    pathname.startsWith("/_next/") ||
    pathname.includes("/favicon.ico") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/api/projects") ||
    pathname.startsWith("/api/gpt/projects-gpt-handler") || 
    pathname.startsWith("/api/gpt/[model]-gpt-handler")
  ) {
    console.log("Ruta pública detectada, permitiendo acceso.");
    return NextResponse.next();
  }

  // Autenticación con NextAuth
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    console.log('No hay token, redirigiendo a login');
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  // Mapeo de rutas a permisos requeridos
  const routePermissions = {
    '/admin/users': { module: 'users', action: 'view' },
    '/api/users': { module: 'users', action: 'view' },
    '/projects/create': { module: 'projects', action: 'create' },
    '/projects/edit': { module: 'projects', action: 'edit' },
    '/quotations/new': { module: 'quotations', action: 'create' },
    '/quotations/edit': { module: 'quotations', action: 'edit' },
    '/reports': { module: 'reports', action: 'view' },
    '/reports/export': { module: 'reports', action: 'export' },
    '/inventory': { module: 'inventory', action: 'view' },
    '/inventory/edit': { module: 'inventory', action: 'edit' },
  };

  // Verifica permisos en rutas protegidas
  const requiredPermission = routePermissions[pathname];
  if (requiredPermission) {
    console.log('Verificando permisos para:', pathname);
    console.log('Permisos requeridos:', JSON.stringify(requiredPermission, null, 2));
    console.log('Rol del usuario:', token.user.role);

    const hasAccess = hasPermission(
      token.user.role,
      requiredPermission.module,
      requiredPermission.action
    );

    console.log('¿Tiene acceso?:', hasAccess);

    if (!hasAccess) {
      console.log('Acceso denegado, redirigiendo a unauthorized');
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  console.log('Permitiendo acceso a la ruta');
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
};
