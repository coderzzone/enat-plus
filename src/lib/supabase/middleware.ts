import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public paths that do not require authentication
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/join');
  const isPublicRoute = pathname === '/' || pathname.startsWith('/api/auth');

  if (!user && !isAuthRoute && !isPublicRoute) {
    // Unauthenticated user trying to access /app or /clinic -> redirect to /login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    // Fetch profile role for role-based redirects
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'mother';

    // If logged in and visiting login or register, redirect to appropriate portal
    if (isAuthRoute && !pathname.startsWith('/join')) {
      const url = request.nextUrl.clone();
      if (role === 'super_admin') {
        url.pathname = '/admin';
      } else if (role === 'clinic_staff') {
        url.pathname = '/clinic';
      } else {
        url.pathname = '/app';
      }
      return NextResponse.redirect(url);
    }

    // Role-based boundary enforcement
    if (pathname.startsWith('/admin') && role !== 'super_admin') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'clinic_staff' ? '/clinic' : '/app';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/clinic') && role !== 'clinic_staff' && role !== 'super_admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/app';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/app') && (role === 'clinic_staff' || role === 'super_admin')) {
      const url = request.nextUrl.clone();
      url.pathname = role === 'super_admin' ? '/admin' : '/clinic';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
