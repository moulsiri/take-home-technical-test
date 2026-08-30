import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasAuthCookies = request.cookies.has('accessToken') || request.cookies.has('refreshToken');
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password');

  if (isAuthPage && hasAuthCookies) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  if (request.nextUrl.pathname.startsWith('/profile') && !hasAuthCookies) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/profile', '/forgot-password', '/reset-password'],
};
