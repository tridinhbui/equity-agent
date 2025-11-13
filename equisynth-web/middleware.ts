import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// Allow public routes (home page serves as login)
	if (pathname === "/" || pathname === "/login") {
		return NextResponse.next();
	}

	// Protect the rest: require session token
	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
	if (!token) {
		const url = new URL("/", req.url);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

// Ignore Next internals, API routes, and any path with a file extension (e.g., .png, .svg, .css, .js)
export const config = {
	matcher: ["/((?!api|_next|.*\\..*).*)"],
};
