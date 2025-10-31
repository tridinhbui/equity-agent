import { env, pipeline, type Pipeline } from "@xenova/transformers";

let embedder: Pipeline | null = null;

async function getEmbedder(): Promise<Pipeline> {
	if (embedder) return embedder;

	// We're in Node.js (Next.js API routes), not browser
	// Allow local model caching in filesystem
	env.allowLocalModels = true;
	env.useBrowserCache = false;
	env.cacheDir = "./.cache/transformers"; // Cache models locally
	
	// Configure to use WASM backend
	env.backends = env.backends || {} as any;
	(env.backends as any).onnx = (env.backends as any).onnx || {};
	(env.backends as any).onnx.wasm = (env.backends as any).onnx.wasm || {};
	(env.backends as any).onnx.wasm.numThreads = 1;

	embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
	return embedder;
}

function meanPool(tensor: any): number[] {
	const data = tensor.data as Float32Array | number[];
	const dims = tensor.dims as number[];
	const tokens = dims[1];
	const hidden = dims[2];
	const out = new Float32Array(hidden);
	for (let t = 0; t < tokens; t++) {
		for (let h = 0; h < hidden; h++) {
			out[h] += (data as any)[t * hidden + h];
		}
	}
	for (let h = 0; h < hidden; h++) out[h] /= tokens;
	return Array.from(out);
}

export async function embedLocal(texts: string[]): Promise<number[][]> {
	const model = await getEmbedder();
	const vectors: number[][] = [];
	for (const t of texts) {
		const res: any = await model(t, { pooling: "none", normalize: true });
		vectors.push(meanPool(res));
	}
	return vectors;
}
