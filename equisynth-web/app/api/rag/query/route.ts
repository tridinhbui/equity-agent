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
		const exists = await fs.access(embPath).then(() => true).catch(() => false);
		if (!exists) return new Response(JSON.stringify({ error: "embeddings.json not found. Run embed first." }), { status: 404 });

		const qv = await embedQueryLocal(query);
		const items: any[] = JSON.parse(await fs.readFile(embPath, "utf-8"));
		const scored = items.map((it, idx) => ({ idx, score: cosine(qv, it.embedding), text: it.text, metadata: it.metadata }));
		scored.sort((a, b) => b.score - a.score);
		return new Response(JSON.stringify({ results: scored.slice(0, topK) }), { status: 200, headers: { "Content-Type": "application/json" } });
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), { status: 500 });
	}
}
