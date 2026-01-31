import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicPaths = ["/login", "/signup"];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (publicPaths.some((p) => path.startsWith(p))) {
      if (token?.role === "STUDENT") return NextResponse.redirect(new URL("/student/dashboard", req.url));
      if (token?.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      if (token?.role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/super-admin/dashboard", req.url));
      return NextResponse.next();
    }

    if (path.startsWith("/student") && token?.role !== "STUDENT") {
      if (token?.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      if (token?.role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/super-admin/dashboard", req.url));
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      if (token?.role === "STUDENT") return NextResponse.redirect(new URL("/student/dashboard", req.url));
      if (token?.role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/super-admin/dashboard", req.url));
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (path.startsWith("/super-admin") && token?.role !== "SUPER_ADMIN") {
      if (token?.role === "STUDENT") return NextResponse.redirect(new URL("/student/dashboard", req.url));
      if (token?.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (publicPaths.some((p) => path.startsWith(p))) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/student/:path*", "/admin/:path*", "/super-admin/:path*", "/login", "/signup"],
};
