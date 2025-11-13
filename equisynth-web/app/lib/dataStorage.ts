import path from "path";
import { promises as fs } from "fs";

export const DATA_ROOT = path.join(process.cwd(), "data");

// Normalize ticker to uppercase with no surrounding whitespace
export function normalizeTicker(ticker: string): string {
	return String(ticker || "").trim().toUpperCase();
}

export function getFilingDirectory(ticker: string, form: string, filed: string): string {
	const safeTicker = normalizeTicker(ticker);
	const safeForm = String(form || "").trim().toUpperCase();
	const safeFiled = String(filed || "").trim();
	return path.join(DATA_ROOT, safeTicker, `${safeForm}_${safeFiled}`);
}

export function getFilingPath(ticker: string, form: string, filed: string, fileName: string): string {
	return path.join(getFilingDirectory(ticker, form, filed), fileName);
}

export async function ensureDirectory(dirPath: string): Promise<void> {
	await fs.mkdir(dirPath, { recursive: true });
}

export async function ensureFileDirectory(filePath: string): Promise<void> {
	await ensureDirectory(path.dirname(filePath));
}

export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

export async function readJSONFile<T>(filePath: string): Promise<T | null> {
	const exists = await fileExists(filePath);
	if (!exists) return null;
	const raw = await fs.readFile(filePath, "utf-8");
	return JSON.parse(raw) as T;
}

export async function writeJSONFile(filePath: string, data: any, pretty = true): Promise<void> {
	await ensureFileDirectory(filePath);
	const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
	await fs.writeFile(filePath, content, "utf-8");
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
	await ensureFileDirectory(filePath);
	await fs.writeFile(filePath, content, "utf-8");
}


