import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
	getConversationSession,
	getMessages,
	deleteConversationSession,
} from "@/app/lib/db";

export const runtime = "nodejs";

// GET: Fetch a specific conversation session with all messages
export async function GET(
	req: NextRequest,
	{ params }: { params: { sessionId: string } }
) {
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
		const sessionId = parseInt(params.sessionId);

		if (isNaN(sessionId)) {
			return NextResponse.json(
				{ error: "Invalid session ID" },
				{ status: 400 }
			);
		}

		const session = await getConversationSession(sessionId, userId);
		if (!session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 }
			);
		}

		const messages = await getMessages(sessionId, userId);

		return NextResponse.json({
			session,
			messages,
		});
	} catch (err: any) {
		console.error("Error fetching conversation:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to fetch conversation" },
			{ status: 500 }
		);
	}
}

// DELETE: Delete a conversation session
export async function DELETE(
	req: NextRequest,
	{ params }: { params: { sessionId: string } }
) {
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

		const userId = token.sub;
		const sessionId = parseInt(params.sessionId);

		if (isNaN(sessionId)) {
			return NextResponse.json(
				{ error: "Invalid session ID" },
				{ status: 400 }
			);
		}

		const deleted = await deleteConversationSession(sessionId, userId);
		if (!deleted) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (err: any) {
		console.error("Error deleting conversation:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to delete conversation" },
			{ status: 500 }
		);
	}
}

