import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get the user session
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  console.log(
    "🛡️ Middleware - User:",
    user?.email,
    "Path:",
    request.nextUrl.pathname
  );

  // Public routes
  const publicRoutes = [
    "/login",
    "/auth",
    "/register",
    "/api/auth",
    "/api/user/role",
    "/accept-invitation",
    "/invitation-error",
    "/api/accept-invitation",
    "/unauthorized",
    "/_next",
    "/favicon.ico",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    console.log("❌ No user, redirecting to login");
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    console.log("✅ User authenticated, redirecting from auth page to /");
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role-based route protection - ONLY for protected routes
  if (user && !isPublicRoute) {
    try {
      // Create headers with the same cookies from the request
      const headers = new Headers();
      request.headers.forEach((value, key) => {
        headers.set(key, value);
      });

      console.log("🔍 Fetching user role from API...");

      const userResponse = await fetch(
        `${request.nextUrl.origin}/api/user/role`,
        {
          headers: headers,
        }
      );

      console.log("📊 API response status:", userResponse.status);

      if (userResponse.ok) {
        const data = await userResponse.json();
        const userRole = data?.user?.role;

        console.log("🎯 User role:", userRole);

        // Redirect root path based on role
        if (request.nextUrl.pathname === "/") {
          const url = request.nextUrl.clone();
          if (userRole === "ADMIN") {
            url.pathname = "/admin";
            console.log("🔄 Redirecting admin to /admin");
            return NextResponse.redirect(url);
          } else if (userRole === "TEACHER") {
            // Teacher stays on "/" - no redirect needed
            console.log("✅ Teacher can stay on /");
            return supabaseResponse;
          } else {
            // Other roles stay on "/" - no redirect needed
            console.log("✅ Other role can stay on /");
            return supabaseResponse;
          }
        }

        // Define role-based route access
        const adminRoutes = ["/admin"];
        const teacherRoutes = ["/teacher"];

        // Check if current path requires specific role
        const isAdminRoute = adminRoutes.some((route) =>
          request.nextUrl.pathname.startsWith(route)
        );
        const isTeacherRoute = teacherRoutes.some((route) =>
          request.nextUrl.pathname.startsWith(route)
        );

        // Role-based access control
        if (isAdminRoute && userRole !== "ADMIN") {
          console.log("❌ Admin route access denied for role:", userRole);
          const url = request.nextUrl.clone();
          url.pathname = "/unauthorized";
          return NextResponse.redirect(url);
        }

        if (isTeacherRoute && userRole !== "TEACHER") {
          console.log("❌ Teacher route access denied for role:", userRole);
          const url = request.nextUrl.clone();
          url.pathname = "/unauthorized";
          return NextResponse.redirect(url);
        }

        console.log("✅ Allowing access to:", request.nextUrl.pathname);
        return supabaseResponse;
      } else {
        console.error("❌ Failed to fetch user role:", userResponse.status);
        // If we can't get the role, allow access but log the issue
        console.log("⚠️ Allowing access despite role fetch failure");
        return supabaseResponse;
      }
    } catch (error) {
      console.error("❌ Error in middleware role check:", error);
      // If there's an error, allow access but log the issue
      console.log("⚠️ Allowing access despite error");
      return supabaseResponse;
    }
  }

  console.log("✅ Allowing public route access");
  return supabaseResponse;
}
