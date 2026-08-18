import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icon',
  '/apple-icon',
  '/robots.txt',
  '/sitemap.xml',
  '/api',
  '/.well-known',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for refresh token in cookies or presence of session indicator
  // Since token lives in sessionStorage (client-only), we rely on a lightweight
  // cookie set on login to signal authenticated state at the edge.
  const authCookie = req.cookies.get('hg_auth')?.value;

  if (!authCookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|login|register|icon|apple-icon|\\.well-known).*)',
  ],
};
