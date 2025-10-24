import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect paths without a locale to //{path}
  const localePattern = /^\/(de|en|vi)(\/|$)/;
  if (!localePattern.test(pathname)) {
    return NextResponse.redirect(new URL(`/en${pathname}`, req.url));
  }

  // Use the internationalization middleware for other routes
  return intlMiddleware(req);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    "/",
    "/me",
    "/(de|en|vi)/:path*",
    "/login",
    "/registration",
    "/listing",
    "/about",
    "/checkout",
    "/post-listing",
    "/post-listing/:id",
    "/profile",
    "/profile/:id",
    "/profile/me",
    "/settings",
  ],
};
