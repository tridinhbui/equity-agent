import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
	getConversationSessions,
	createConversationSession,
	getConversationSession,
} from "@/app/lib/db";

export const runtime = "nodejs";

// GET: Fetch conversation history for the current user
export async function GET(req: NextRequest) {
	try {
		const token = await getToken({
			req,
			secret: process.env.NEXTAUTH_SECRET,
		});

		if (!token || !token.sub) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json(
				{ error: "Database not configured. Please set DATABASE_URL in environment variables." },
				{ status: 503 }
			);
		}

		const userId = token.sub;
		const sessions = await getConversationSessions(userId);

		return NextResponse.json({ sessions });
	} catch (err: any) {
		console.error("Error fetching conversation sessions:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to fetch sessions" },
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

		if (!token || !token.sub) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json(
				{ error: "Database not configured. Please set DATABASE_URL in environment variables." },
				{ status: 503 }
			);
		}

		const userId = token.sub;
		const body = await req.json();
		const { ticker, form, filed, title } = body;

		const session = await createConversationSession({
			userId,
			ticker,
			form,
			filed,
			title: title || `Chat about ${ticker || "filing"}`,
		});

		return NextResponse.json({ session });
	} catch (err: any) {
		console.error("Error creating conversation session:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to create session" },
			{ status: 500 }
		);
	}
}

