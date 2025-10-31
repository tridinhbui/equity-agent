import { NextResponse } from "next/server";
import { initializeDatabase } from "@/app/lib/db";

export const runtime = "nodejs";

export async function POST() {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json(
				{
					error:
						"DATABASE_URL not configured. Add it to .env.local to enable database features.",
					info: "The app will continue to work with file-based storage.",
				},
				{ status: 400 }
			);
		}

		await initializeDatabase();

		return NextResponse.json({
			success: true,
			message: "Database initialized successfully",
		});
	} catch (err: any) {
		console.error("Database initialization error:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to initialize database" },
			{ status: 500 }
		);
	}
}

