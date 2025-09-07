import { defineMiddleware } from 'astro:middleware';
import { getSession } from 'auth-astro/server';

export const onRequest = defineMiddleware(async (context, next) => {
  // Get the current session
  const session = await getSession(context.request);
  
  // Add session to locals for easy access in pages
  context.locals.session = session;
  context.locals.user = session?.user || null;
  
  // Check for protected routes
  const protectedRoutes = [
    '/admin',
    '/dashboard',
    '/elections/manage',
  ];
  
  const pathname = context.url.pathname;
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Redirect to sign in if trying to access protected route without auth
  if (isProtectedRoute && !session?.user) {
    return context.redirect('/auth/signin');
  }
  
  // Check for admin routes
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isAdminRoute && session?.user?.role !== 'admin' && session?.user?.role !== 'super_admin') {
    return context.redirect('/dashboard');
  }
  
  return next();
});