import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple check for now, can be expanded to verify token
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*'],
};
