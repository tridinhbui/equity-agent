import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { embedLocal } from "@/app/lib/localEmbed";

export const runtime = "nodejs";

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function POST(req: NextRequest) {
	try {
		const { ticker, form, filed, batch = 1, section, maxChunks = 5, resume = true } = await req.json();
		if (!ticker || !form || !filed) return new Response(JSON.stringify({ error: "ticker, form, filed required" }), { status: 400 });
		const baseDir = path.join(process.cwd(), "data", String(ticker).toUpperCase(), `${form}_${filed}`);
		const chunksPath = path.join(baseDir, "chunks.jsonl");
		const exists = await fs.access(chunksPath).then(() => true).catch(() => false);
		if (!exists) return new Response(JSON.stringify({ error: "chunks.jsonl not found" }), { status: 404 });

		const lines = (await fs.readFile(chunksPath, "utf-8")).split(/\r?\n/).filter(Boolean);
		let items = lines.map((l) => JSON.parse(l));
		if (section) items = items.filter((x: any) => String(x.metadata?.section || "").toLowerCase().includes(String(section).toLowerCase()));

		const embPath = path.join(baseDir, "embeddings.json");
		let existing: any[] = [];
		const embExists = await fs.access(embPath).then(() => true).catch(() => false);
		if (embExists) existing = JSON.parse(await fs.readFile(embPath, "utf-8"));

		let start = 0;
		if (resume && existing.length) {
			if (section) {
				const done = existing.filter((e) => String(e.metadata?.section || "").toLowerCase().includes(String(section).toLowerCase())).length;
				start = done;
			} else {
				start = existing.length;
			}
		}
		if (start >= items.length) {
			return new Response(JSON.stringify({ embedded: 0, message: "Nothing to embed (already done)" }), { status: 200 });
		}

		const slice = items.slice(start, Math.min(start + maxChunks, items.length));
		const appended: any[] = [];
		for (let i = 0; i < slice.length; i += batch) {
			const part = slice.slice(i, i + batch);
			const texts = part.map((x) => x.text);
			const vectors = await embedLocal(texts);
			for (let j = 0; j < part.length; j++) {
				appended.push({ embedding: vectors[j], text: part[j].text, metadata: part[j].metadata });
			}
			await sleep(50);
		}

		const out = [...existing, ...appended];
		await fs.writeFile(embPath, JSON.stringify(out), "utf-8");
		return new Response(JSON.stringify({ embedded: appended.length, total: out.length, start }), { status: 200, headers: { "Content-Type": "application/json" } });
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), { status: 500 });
	}
}
