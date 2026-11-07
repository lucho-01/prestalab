import { NextResponse, type NextRequest } from 'next/server';

/**
 * Protección de páginas: sin cookie de sesión no se accede al panel.
 * (La verificación criptográfica del token se hace en cada API con
 * verifySessionCookie; aquí sólo se evita renderizar el panel sin sesión.)
 */
const PUBLIC = ['/login', '/register'];
const PUBLIC_PREFIX = [
  '/api/auth',
  '/api/mobile',
  '/_next',
  '/favicon',
  '/icon',
  '/images',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.includes(pathname) || PUBLIC_PREFIX.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has('prestalab_session');

  // APIs protegidas que no son de auth: si no hay cookie, 401 directo
  if (pathname.startsWith('/api/')) {
    if (!hasSession) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión.' },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)$).*)'],
};
