import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The middleware function to handle authentication redirection
export function middleware(request: NextRequest) {
  // Path this middleware should run on
  const publicPaths = [ '/home', '/accueil', '/ajouter_utilisateur', '/calendar', '/controle', '/documents', '/login', '/planning', '/register', '/statistics', '/supprimer_utilisateur', '/tracking' ];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // Get the auth cookie/token
  const authToken = request.cookies.get('authToken')?.value;
  
  // In a real app, we'd verify the token here using JWT or a similar method
  const isAuthenticated = !!authToken;

  // Redirect logic
  if (!isAuthenticated && !isPublicPath) {
    // Not authenticated and trying to access protected route, redirect to login
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if (isAuthenticated && isPublicPath) {
    // Already authenticated and trying to access a public route, redirect to home
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

// Configure the paths where the middleware should run
export const config = {
  matcher: [
    // Match all paths except for static files, api routes, etc.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 