import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// Allow public routes (home page serves as login)
	if (pathname === "/" || pathname === "/login") {
		return NextResponse.next();
	}

	// Allow NextAuth API routes and callbacks
	if (pathname.startsWith("/api/auth")) {
		return NextResponse.next();
	}

	// Protect the rest: require session token
	const token = await getToken({ 
		req, 
		secret: process.env.NEXTAUTH_SECRET
	});
	
	if (!token) {
		// Check if session cookie exists (might be set but token not yet validated)
		// This handles the case where OAuth callback just completed
		const sessionCookieName = process.env.NODE_ENV === "production"
			? "__Secure-next-auth.session-token"
			: "next-auth.session-token";
		const sessionCookie = req.cookies.get(sessionCookieName);
		
		// If session cookie exists, allow the request through
		// The client-side session hook will validate it
		if (sessionCookie) {
			return NextResponse.next();
		}
		
		const url = new URL("/", req.url);
		// Preserve the original destination in the query string
		url.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

// Ignore Next internals, API routes, and any path with a file extension (e.g., .png, .svg, .css, .js)
export const config = {
	matcher: ["/((?!api|_next|.*\\..*).*)"],
};
