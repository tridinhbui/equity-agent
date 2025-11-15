import { NextRequest, NextResponse } from "next/server";
import {
	getFilingPath,
	readJSONFile,
	fileExists,
} from "@/app/lib/dataStorage";

export const runtime = "nodejs";

/**
 * GET /api/data/sections
 * Get narrative sections from filing
 */
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const ticker = searchParams.get("ticker");
		const form = searchParams.get("form");
		const filed = searchParams.get("filed");

		if (!ticker || !form || !filed) {
			return NextResponse.json(
				{ error: "ticker, form, and filed are required" },
				{ status: 400 }
			);
		}

		const sectionsPath = getFilingPath(ticker, form, filed, "sections.json");
		const sectionsExist = await fileExists(sectionsPath);

		if (!sectionsExist) {
			return NextResponse.json(
				{ error: "sections.json not found. Please run section first." },
				{ status: 404 }
			);
		}

		const sectionsData = await readJSONFile<{
			ticker: string;
			form: string;
			filed: string;
			sections: Array<{
				name: string;
				startLine: number;
				endLine: number;
				charStart: number;
				charEnd: number;
				charCount: number;
				chunks: number;
				preview: string;
			}>;
		}>(sectionsPath);

		if (!sectionsData || !sectionsData.sections) {
			return NextResponse.json(
				{ error: "No sections found. Please run section first." },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			ticker: ticker.toUpperCase(),
			form,
			filed,
			sections: sectionsData.sections,
		});
	} catch (error: any) {
		console.error("Sections error:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to get sections" },
			{ status: 500 }
		);
	}
}

