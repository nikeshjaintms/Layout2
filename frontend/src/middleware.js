import { NextResponse } from 'next/server';

function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof Buffer !== 'undefined') {
      return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    }
    return JSON.parse(atob(base64));
  } catch (e) {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const isDashboardRoute = pathname.startsWith('/cad-conversion');
  const isAdminRoute = pathname.startsWith('/admin');
  const isSubscriptionRoute = pathname.startsWith('/subscription');
  const isLoginRoute = pathname === '/login';

  // 1. If unauthenticated user tries to access protected pages -> redirect to /login
  if (!token && (isDashboardRoute || isAdminRoute || isSubscriptionRoute)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If token is present, evaluate user permissions and subscription status
  if (token) {
    const payload = decodeJwtPayload(token);

    // If token is invalid or expired
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      if (isDashboardRoute || isAdminRoute || isSubscriptionRoute) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    const isAdmin = payload.role === 'ADMIN';
    const isSubscriptionActive = Boolean(payload.isSubscriptionActive);

    // If logged in user hits /login
    if (isLoginRoute) {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (isSubscriptionActive) {
        return NextResponse.redirect(new URL('/cad-conversion', request.url));
      }
      return NextResponse.redirect(new URL('/subscription', request.url));
    }

    // Non-admin trying to access /admin routes
    if (isAdminRoute && !isAdmin) {
      if (isSubscriptionActive) {
        return NextResponse.redirect(new URL('/cad-conversion', request.url));
      }
      return NextResponse.redirect(new URL('/subscription', request.url));
    }

    // Non-admin trying to access dashboard routes (/cad-conversion) without active subscription
    if (isDashboardRoute && !isAdmin && !isSubscriptionActive) {
      return NextResponse.redirect(new URL('/subscription', request.url));
    }

    // Non-admin with active subscription visiting /subscription without explicit ?view=plans
    if (isSubscriptionRoute && !isAdmin && isSubscriptionActive && !request.nextUrl.searchParams.has('view')) {
      return NextResponse.redirect(new URL('/cad-conversion', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/cad-conversion/:path*',
    '/admin/:path*',
    '/subscription',
    '/subscription/:path*',
    '/login',
  ],
};
