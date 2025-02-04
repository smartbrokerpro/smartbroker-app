import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { hasPermission } from '@/lib/auth/permissions';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const userAgent = req.headers.get("user-agent") || "";

  console.log('\n--- Middleware Debug ---');
  console.log('Pathname:', pathname);
  console.log('User-Agent:', userAgent);

  // Permitir acceso sin restricciones si la solicitud proviene del cron job de Vercel
  if (userAgent.includes("vercel-cron")) {
    console.log("Solicitud desde Vercel Cron, permitiendo acceso sin autenticación");
    return NextResponse.next();
  }

  // Rutas públicas o que no requieren verificación
  if (
    pathname.includes("/api/auth") ||
    pathname === "/auth/sign-in" ||
    pathname.startsWith("/_next/") ||
    pathname.includes("/favicon.ico") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/api/projects") ||
    pathname.startsWith("/api/gpt/projects-gpt-handler") || 
    pathname.startsWith("/api/gpt/[model]-gpt-handler") ||
    pathname.startsWith("/api/updateUF") // Permitir acceso público a esta ruta
  ) {
    console.log('Ruta pública, permitiendo acceso:', pathname);
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log('Token:', JSON.stringify(token, null, 2));

  // Verificación de autenticación
  if (!token) {
    console.log('No hay token, redirigiendo a login');
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  if (pathname === "/auth/sign-in") {
    console.log('Usuario ya autenticado, redirigiendo a home');
    return NextResponse.redirect(new URL("/", req.url));
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

  // Verifica los permisos solo para rutas protegidas
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
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ]
};
