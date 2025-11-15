import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
	getFilingPath,
	getFilingDirectory,
	writeJSONFile,
	fileExists,
} from "@/app/lib/dataStorage";

export const runtime = "nodejs";

/**
 * Identify sections in a 10-K/10-Q filing
 */
function identifySections(text: string): Array<{
	name: string;
	startLine: number;
	endLine: number;
	charStart: number;
	charEnd: number;
	preview: string;
}> {
	const lines = text.split("\n");
	const sections: Array<{
		name: string;
		startLine: number;
		endLine: number;
		charStart: number;
		charEnd: number;
		preview: string;
	}> = [];

	// Common section patterns for 10-K/10-Q
	const sectionPatterns = [
		/^Item\s+1\.?\s*[:\-]?\s*(Business|Description of Business)/i,
		/^Item\s+1A\.?\s*[:\-]?\s*Risk\s+Factors/i,
		/^Item\s+2\.?\s*[:\-]?\s*Properties/i,
		/^Item\s+3\.?\s*[:\-]?\s*Legal\s+Proceedings/i,
		/^Item\s+4\.?\s*[:\-]?\s*Mine\s+Safety/i,
		/^Item\s+5\.?\s*[:\-]?\s*Market/i,
		/^Item\s+6\.?\s*[:\-]?\s*[\[\(]?Selected\s+Financial\s+Data/i,
		/^Item\s+7\.?\s*[:\-]?\s*Management['']?s?\s+Discussion/i,
		/^Item\s+7A\.?\s*[:\-]?\s*Quantitative/i,
		/^Item\s+8\.?\s*[:\-]?\s*Financial\s+Statements/i,
		/^Item\s+9\.?\s*[:\-]?\s*Controls/i,
		/^Item\s+10\.?\s*[:\-]?\s*Directors/i,
		/^Item\s+11\.?\s*[:\-]?\s*Executive/i,
		/^Item\s+12\.?\s*[:\-]?\s*Security/i,
		/^Item\s+13\.?\s*[:\-]?\s*Certain/i,
		/^Item\s+14\.?\s*[:\-]?\s*Accountant/i,
		/^Item\s+15\.?\s*[:\-]?\s*Exhibits/i,
	];

	let currentSection: {
		name: string;
		startLine: number;
		charStart: number;
	} | null = null;

	let charOffset = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const charStart = charOffset;
		charOffset += line.length + 1; // +1 for newline

		// Check if this line matches a section pattern
		for (const pattern of sectionPatterns) {
			if (pattern.test(line)) {
				// Close previous section
				if (currentSection) {
					sections.push({
						name: currentSection.name,
						startLine: currentSection.startLine,
						endLine: i - 1,
						charStart: currentSection.charStart,
						charEnd: charStart - 1,
						preview: text.substring(currentSection.charStart, charStart).substring(0, 500),
					});
				}

				// Extract section name
				const match = line.match(/^Item\s+(\d+[A-Z]?)[\.:]?\s*(.+)/i);
				let sectionName = line.trim();
				if (match) {
					const itemNum = match[1];
					const itemName = match[2]?.trim() || "";
					sectionName = `Item ${itemNum}${itemName ? `: ${itemName}` : ""}`;
				}

				currentSection = {
					name: sectionName,
					startLine: i,
					charStart,
				};
				break;
			}
		}
	}

	// Close last section
	if (currentSection) {
		sections.push({
			name: currentSection.name,
			startLine: currentSection.startLine,
			endLine: lines.length - 1,
			charStart: currentSection.charStart,
			charEnd: charOffset,
			preview: text.substring(currentSection.charStart, charOffset).substring(0, 500),
		});
	}

	return sections;
}

/**
 * Create chunks from text with metadata
 */
function createChunks(
	text: string,
	sections: Array<{
		name: string;
		charStart: number;
		charEnd: number;
	}>,
	chunkSize: number = 1000,
	overlap: number = 200
): Array<{
	text: string;
	metadata: {
		ticker: string;
		form: string;
		filed: string;
		section: string;
		char_start: number;
		char_end: number;
	};
}> {
	const chunks: Array<{
		text: string;
		metadata: {
			ticker: string;
			form: string;
			filed: string;
			section: string;
			char_start: number;
			char_end: number;
		};
	}> = [];

	for (const section of sections) {
		const sectionText = text.substring(section.charStart, section.charEnd);
		let start = 0;

		while (start < sectionText.length) {
			const end = Math.min(start + chunkSize, sectionText.length);
			const chunkText = sectionText.substring(start, end).trim();

			if (chunkText.length > 100) {
				// Only create chunks with substantial content
				chunks.push({
					text: chunkText,
					metadata: {
						ticker: "", // Will be set by caller
						form: "", // Will be set by caller
						filed: "", // Will be set by caller
						section: section.name,
						char_start: section.charStart + start,
						char_end: section.charStart + end,
					},
				});
			}

			start = end - overlap; // Overlap for context
		}
	}

	return chunks;
}

/**
 * POST /api/data/section
 * Section and chunk a filing
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { ticker, form, filed } = body;

		if (!ticker || !form || !filed) {
			return NextResponse.json(
				{ error: "ticker, form, and filed are required" },
				{ status: 400 }
			);
		}

		const textPath = getFilingPath(ticker, form, filed, "text.txt");
		const textExists = await fileExists(textPath);

		if (!textExists) {
			return NextResponse.json(
				{ error: "text.txt not found. Please run ingest first." },
				{ status: 404 }
			);
		}

		const text = await fs.readFile(textPath, "utf-8");

		// Identify sections
		const sections = identifySections(text);

		// Add metadata to sections
		const sectionsWithMetadata = sections.map((s) => ({
			...s,
			charCount: s.charEnd - s.charStart,
			chunks: 0, // Will be calculated after chunking
		}));

		// Create chunks
		const chunks = createChunks(text, sections, 1000, 200);

		// Update section chunk counts
		for (const chunk of chunks) {
			const section = sectionsWithMetadata.find(
				(s) =>
					chunk.metadata.char_start >= s.charStart &&
					chunk.metadata.char_end <= s.charEnd
			);
			if (section) {
				section.chunks++;
			}
		}

		// Add ticker, form, filed to chunk metadata
		for (const chunk of chunks) {
			chunk.metadata.ticker = ticker.toUpperCase();
			chunk.metadata.form = form;
			chunk.metadata.filed = filed;
		}

		// Save sections
		const sectionsPath = getFilingPath(ticker, form, filed, "sections.json");
		await writeJSONFile(sectionsPath, {
			ticker: ticker.toUpperCase(),
			form,
			filed,
			sections: sectionsWithMetadata,
		});

		// Save chunks as JSONL
		const chunksPath = getFilingPath(ticker, form, filed, "chunks.jsonl");
		const chunksLines = chunks.map((chunk) => JSON.stringify(chunk)).join("\n");
		await fs.writeFile(chunksPath, chunksLines, "utf-8");

		return NextResponse.json({
			success: true,
			ticker: ticker.toUpperCase(),
			form,
			filed,
			sections: sectionsWithMetadata.length,
			chunks: chunks.length,
		});
	} catch (error: any) {
		console.error("Section error:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to section filing" },
			{ status: 500 }
		);
	}
}

