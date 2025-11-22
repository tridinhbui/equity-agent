import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { embedLocal } from "@/app/lib/localEmbed";

export const runtime = "nodejs";

async function embedQueryLocal(text: string): Promise<number[]> {
	const [v] = await embedLocal([text]);
	return v;
}

function cosine(a: number[], b: number[]) {
	let dot = 0, na = 0, nb = 0;
	for (let i = 0; i < a.length; i++) { const x = a[i], y = b[i]; dot += x * y; na += x * x; nb += y * y; }
	return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

export async function POST(req: NextRequest) {
	try {
		const { ticker, form, filed, query, topK = 5 } = await req.json();
		if (!ticker || !form || !filed || !query) return new Response(JSON.stringify({ error: "ticker, form, filed, query required" }), { status: 400 });
		const baseDir = path.join(process.cwd(), "data", String(ticker).toUpperCase(), `${form}_${filed}`);
		const embPath = path.join(baseDir, "embeddings.json");
		const chunksPath = path.join(baseDir, "chunks.jsonl");
		
		// Check if embeddings exist
		const embExists = await fs.access(embPath).then(() => true).catch(() => false);
		if (!embExists) return new Response(JSON.stringify({ error: "embeddings.json not found. Run embed first." }), { status: 404 });

		const qv = await embedQueryLocal(query);
		const items: any[] = JSON.parse(await fs.readFile(embPath, "utf-8"));
		
		// If we have very few embeddings, also search in chunks.jsonl for keyword matches
		const isRiskQuery = /risk\s+factors?|main\s+risks?|key\s+risks?/i.test(query);
		let additionalItems: any[] = [];
		
		if (items.length < 50 || isRiskQuery) {
			// Load chunks.jsonl to find relevant chunks that might not be embedded yet
			const chunksExists = await fs.access(chunksPath).then(() => true).catch(() => false);
			if (chunksExists) {
				const chunksData = await fs.readFile(chunksPath, "utf-8");
				const chunks = chunksData.split("\n").filter(line => line.trim()).map(line => JSON.parse(line));
				
				// For risk queries, find chunks with "Item 1A" or "Risk Factors" in text
				if (isRiskQuery) {
					// First, find the starting chunk with "Item 1A. Risk Factors"
					let riskStartIndex = -1;
					for (let i = 0; i < chunks.length; i++) {
						const text = (chunks[i].text || "").toLowerCase();
						if (text.includes("item 1a") && text.includes("risk factors")) {
							riskStartIndex = i;
							break;
						}
					}
					
					// If we found the risk factors section, get chunks from that section
					let riskChunks: any[] = [];
					if (riskStartIndex >= 0) {
						// Get chunks from risk section (typically chunks 47-100+ contain risk factors)
						// Get up to 30 chunks starting from the risk section
						const riskSectionChunks = chunks.slice(riskStartIndex, Math.min(riskStartIndex + 30, chunks.length));
						
						riskChunks = riskSectionChunks.filter((chunk: any) => {
							const text = (chunk.text || "").toLowerCase();
							// Must have substantial content
							const hasSubstantialContent = text.length > 200;
							// Not already embedded
							const notEmbedded = !items.some((item: any) => item.text === chunk.text);
							// Filter out noise
							const techIdCount = (text.match(/(us-gaap|aapl|iso4217|xbrli):/gi) || []).length;
							const isNotNoise = techIdCount < 20;
							// Should contain risk-related keywords
							const hasRiskKeywords = text.includes("risk") || text.includes("adverse") || 
							                         text.includes("materially") || text.includes("uncertainty") ||
							                         text.includes("competition") || text.includes("supply chain");
							
							return hasSubstantialContent && notEmbedded && isNotNoise && hasRiskKeywords;
						});
					} else {
						// Fallback: find any chunks with risk-related content
						riskChunks = chunks.filter((chunk: any) => {
							const text = (chunk.text || "").toLowerCase();
							const hasRiskSection = text.includes("item 1a") || text.includes("risk factors");
							const hasSubstantialContent = text.length > 200;
							const notEmbedded = !items.some((item: any) => item.text === chunk.text);
							const techIdCount = (text.match(/(us-gaap|aapl|iso4217|xbrli):/gi) || []).length;
							const isNotNoise = techIdCount < 20;
							
							return hasRiskSection && hasSubstantialContent && notEmbedded && isNotNoise;
						});
					}
					
					// Embed these risk chunks on the fly (limit to 20 to avoid timeout)
					const chunksToEmbed = riskChunks.slice(0, 20);
					if (chunksToEmbed.length > 0) {
						try {
							const texts = chunksToEmbed.map(c => c.text);
							const embeddings = await embedLocal(texts);
							for (let i = 0; i < chunksToEmbed.length; i++) {
								additionalItems.push({
									embedding: embeddings[i],
									text: chunksToEmbed[i].text,
									metadata: chunksToEmbed[i].metadata
								});
							}
							console.log(`Embedded ${chunksToEmbed.length} risk chunks on-the-fly`);
						} catch (e) {
							console.warn("Failed to embed risk chunks:", e);
						}
					}
				}
			}
		}
		
		// Combine embedded items with additional items
		const allItems = [...items, ...additionalItems];
		
		// Filter out chunks with too much noise (XBRL/XML data, very short text, etc.)
		const filteredItems = allItems.filter((it: any) => {
			const text = it.text || '';
			// Skip chunks that are mostly XBRL/XML noise
			if (text.length < 100) return false;
			// Skip chunks that are mostly URLs or technical identifiers
			const urlCount = (text.match(/https?:\/\//g) || []).length;
			const xmlTagCount = (text.match(/<[^>]+>/g) || []).length;
			if (urlCount > 5 || xmlTagCount > 10) return false;
			// Skip chunks that are mostly technical identifiers (us-gaap:, aapl:, etc.)
			const techIdCount = (text.match(/(us-gaap|aapl|iso4217|xbrli):/gi) || []).length;
			if (techIdCount > 20) return false;
			return true;
		});
		
		// Calculate scores and boost risk-related chunks for risk queries
		const scored = filteredItems.map((it, idx) => {
			let score = cosine(qv, it.embedding);
			const text = (it.text || "").toLowerCase();
			
			// Boost score for risk-related chunks when querying about risks
			if (isRiskQuery) {
				// Strong boost for chunks that explicitly mention "Item 1A" or "Risk Factors"
				if (text.includes("item 1a") && text.includes("risk factors")) {
					score += 0.5; // Strong boost
				} else if (text.includes("item 1a") || text.includes("risk factors")) {
					score += 0.3; // Medium boost
				}
				
				// Boost for chunks with substantial risk content
				const riskKeywords = ["risk", "adverse", "materially", "uncertainty", "competition", 
				                     "supply chain", "geopolitical", "economic conditions", "market risk"];
				const keywordCount = riskKeywords.filter(kw => text.includes(kw)).length;
				if (keywordCount >= 3 && text.length > 300) {
					score += 0.2; // Boost for chunks with multiple risk keywords
				} else if (keywordCount >= 1 && text.length > 500) {
					score += 0.1; // Smaller boost for chunks with some risk content
				}
				
				// Additional boost for chunks that describe specific risks
				if (text.includes("can materially adversely affect") || 
				    text.includes("may be unable to") ||
				    text.includes("could have a material")) {
					score += 0.15; // Boost for risk descriptions
				}
			}
			
			return { 
				idx, 
				score, 
				text: it.text, 
				metadata: it.metadata 
			};
		});
		
		scored.sort((a, b) => b.score - a.score);
		return new Response(JSON.stringify({ results: scored.slice(0, topK) }), { status: 200, headers: { "Content-Type": "application/json" } });
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), { status: 500 });
	}
}
