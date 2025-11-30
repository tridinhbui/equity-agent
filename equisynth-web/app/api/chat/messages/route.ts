import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { saveMessage, getConversationSession } from "@/app/lib/db";

export const runtime = "nodejs";

// POST: Save a message to a conversation session
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
			// Silently return success if database not configured - allow chat to work
			return NextResponse.json({ message: null });
		}

		const userId = token.sub;
		const body = await req.json();
		const { sessionId, role, content, sources, error } = body;

		if (!sessionId || !role || !content) {
			return NextResponse.json(
				{ error: "sessionId, role, and content are required" },
				{ status: 400 }
			);
		}

		// Verify session belongs to user
		const session = await getConversationSession(sessionId, userId);
		if (!session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 }
			);
		}

		const message = await saveMessage({
			sessionId,
			role,
			content,
			sources,
			error,
		});

		return NextResponse.json({ message });
	} catch (err: any) {
		console.error("Error saving message:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to save message" },
			{ status: 500 }
		);
	}
}

