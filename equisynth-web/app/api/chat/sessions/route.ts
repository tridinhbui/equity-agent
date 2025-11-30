import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
	getConversationSessions,
	createConversationSession,
	getConversationSession,
	initializeDatabase,
} from "@/app/lib/db";

export const runtime = "nodejs";

// GET: Fetch conversation history for the current user
export async function GET(req: NextRequest) {
	try {
		const token = await getToken({
			req,
			secret: process.env.NEXTAUTH_SECRET,
		});

		// Get userId with fallback for dev/testing
		let userId: string | null = null;
		if (token?.sub) {
			userId = token.sub;
		} else {
			// For dev/testing, use fallback
			userId = `temp-user-${Date.now()}`;
			console.warn("[GET /api/chat/sessions] No auth token, using fallback userId:", userId);
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json(
				{ 
					error: "Database not configured. Please set DATABASE_URL in environment variables.",
					code: "DATABASE_NOT_CONFIGURED"
				},
				{ status: 503 }
			);
		}

		const sessions = await getConversationSessions(userId);

		return NextResponse.json({ sessions });
	} catch (err: any) {
		console.error("[GET /api/chat/sessions] Error:", err);
		return NextResponse.json(
			{ 
				error: err?.message || "Failed to fetch sessions",
				code: "FETCH_ERROR"
			},
			{ status: 500 }
		);
	}
}

// POST: Create a new conversation session
export async function POST(req: NextRequest) {
	try {
		const token = await getToken({
			req,
			secret: process.env.NEXTAUTH_SECRET,
		});

		if (!process.env.DATABASE_URL) {
			return NextResponse.json(
				{ 
					error: "Database not configured. Please set DATABASE_URL in environment variables.",
					code: "DATABASE_NOT_CONFIGURED"
				},
				{ status: 503 }
			);
		}

		// Read body once
		const body = await req.json();
		const { ticker, form, filed, title } = body;

		// Get userId with fallback for dev/testing
		let userId: string | null = null;
		if (token?.sub) {
			userId = token.sub;
		} else {
			// For dev/testing, try to get from request body or use fallback
			userId = body.userId || `temp-user-${Date.now()}`;
			console.warn("[POST /api/chat/sessions] No auth token, using fallback userId:", userId);
		}

		console.log("[POST /api/chat/sessions] Creating session with userId:", userId);

		try {
			const session = await createConversationSession({
				userId,
				ticker,
				form,
				filed,
				title: title || `Chat about ${ticker || "filing"}`,
			});

			if (!session || !session.id) {
				throw new Error("Session creation returned null or missing id");
			}

			console.log("[POST /api/chat/sessions] Session created successfully:", session.id);
			return NextResponse.json({ session });
		} catch (dbError: any) {
			// Check if error is due to missing tables
			const errorMessage = dbError?.message || "";
			const isTableNotFound = 
				errorMessage.includes("does not exist") ||
				errorMessage.includes("relation") ||
				errorMessage.includes("table") ||
				errorMessage.includes("42P01"); // PostgreSQL error code for undefined table

			if (isTableNotFound) {
				console.log("[POST /api/chat/sessions] Tables not found, attempting auto-initialization...");
				try {
					await initializeDatabase();
					console.log("[POST /api/chat/sessions] Database initialized, retrying session creation...");
					
					// Retry session creation
					const session = await createConversationSession({
						userId,
						ticker,
						form,
						filed,
						title: title || `Chat about ${ticker || "filing"}`,
					});

					if (!session || !session.id) {
						throw new Error("Session creation failed after initialization");
					}

					console.log("[POST /api/chat/sessions] Session created after auto-init:", session.id);
					return NextResponse.json({ session });
				} catch (initError: any) {
					console.error("[POST /api/chat/sessions] Auto-initialization failed:", initError);
					return NextResponse.json(
						{ 
							error: "Database connection failed. Auto-initialization attempted but failed.",
							details: initError?.message,
							code: "DATABASE_INIT_FAILED"
						},
						{ status: 500 }
					);
				}
			}

			// Other database errors
			console.error("[POST /api/chat/sessions] Database error:", dbError);
			return NextResponse.json(
				{ 
					error: "Database connection failed",
					details: dbError?.message,
					code: "DATABASE_ERROR"
				},
				{ status: 500 }
			);
		}
	} catch (err: any) {
		console.error("[POST /api/chat/sessions] Unexpected error:", err);
		return NextResponse.json(
			{ 
				error: err?.message || "Failed to create session",
				code: "UNKNOWN_ERROR"
			},
			{ status: 500 }
		);
	}
}

