import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
	if (!pool) {
		pool = new Pool({
			connectionString: process.env.DATABASE_URL,
			// For local development without Postgres, we'll check if URL exists
			// If not, this will fail gracefully
		});
	}
	return pool;
}

export async function initializeDatabase() {
	const pool = getPool();
	
	// Create filings table
	await pool.query(`
		CREATE TABLE IF NOT EXISTS filings (
			id SERIAL PRIMARY KEY,
			ticker VARCHAR(10) NOT NULL,
			cik VARCHAR(20),
			form_type VARCHAR(10) NOT NULL,
			filed_date DATE NOT NULL,
			filing_url TEXT,
			status VARCHAR(20) DEFAULT 'pending',
			local_path TEXT,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			UNIQUE(ticker, form_type, filed_date)
		);
	`);

	// Create index on ticker and form_type
	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_filings_ticker ON filings(ticker);
		CREATE INDEX IF NOT EXISTS idx_filings_form_type ON filings(form_type);
		CREATE INDEX IF NOT EXISTS idx_filings_status ON filings(status);
	`);

	// Create financial_metrics table
	await pool.query(`
		CREATE TABLE IF NOT EXISTS financial_metrics (
			id SERIAL PRIMARY KEY,
			filing_id INTEGER REFERENCES filings(id) ON DELETE CASCADE,
			metric_name VARCHAR(50) NOT NULL,
			metric_value NUMERIC,
			metric_text TEXT,
			period VARCHAR(20),
			created_at TIMESTAMP DEFAULT NOW()
		);
	`);

	// Create index on filing_id and metric_name
	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_metrics_filing ON financial_metrics(filing_id);
		CREATE INDEX IF NOT EXISTS idx_metrics_name ON financial_metrics(metric_name);
	`);

	// Create embeddings_status table (track which filings have been embedded)
	await pool.query(`
		CREATE TABLE IF NOT EXISTS embeddings_status (
			id SERIAL PRIMARY KEY,
			filing_id INTEGER REFERENCES filings(id) ON DELETE CASCADE,
			total_chunks INTEGER DEFAULT 0,
			embedded_chunks INTEGER DEFAULT 0,
			last_embedded_at TIMESTAMP,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			UNIQUE(filing_id)
		);
	`);

	console.log("✅ Database initialized successfully");
}

// Filing operations
export async function saveFiling(data: {
	ticker: string;
	cik?: string;
	formType: string;
	filedDate: string;
	filingUrl?: string;
	status?: string;
	localPath?: string;
}) {
	const pool = getPool();
	const result = await pool.query(
		`
		INSERT INTO filings (ticker, cik, form_type, filed_date, filing_url, status, local_path)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (ticker, form_type, filed_date) 
		DO UPDATE SET 
			cik = EXCLUDED.cik,
			filing_url = EXCLUDED.filing_url,
			status = EXCLUDED.status,
			local_path = EXCLUDED.local_path,
			updated_at = NOW()
		RETURNING *;
		`,
		[
			data.ticker,
			data.cik,
			data.formType,
			data.filedDate,
			data.filingUrl,
			data.status || "pending",
			data.localPath,
		]
	);
	return result.rows[0];
}

export async function updateFilingStatus(
	ticker: string,
	formType: string,
	filedDate: string,
	status: string
) {
	const pool = getPool();
	await pool.query(
		`UPDATE filings SET status = $1, updated_at = NOW() WHERE ticker = $2 AND form_type = $3 AND filed_date = $4`,
		[status, ticker, formType, filedDate]
	);
}

export async function getFiling(ticker: string, formType: string, filedDate: string) {
	const pool = getPool();
	const result = await pool.query(
		`SELECT * FROM filings WHERE ticker = $1 AND form_type = $2 AND filed_date = $3`,
		[ticker, formType, filedDate]
	);
	return result.rows[0] || null;
}

export async function getAllFilings(ticker?: string) {
	const pool = getPool();
	if (ticker) {
		const result = await pool.query(
			`SELECT * FROM filings WHERE ticker = $1 ORDER BY filed_date DESC`,
			[ticker]
		);
		return result.rows;
	} else {
		const result = await pool.query(
			`SELECT * FROM filings ORDER BY filed_date DESC LIMIT 100`
		);
		return result.rows;
	}
}

// Financial metrics operations
export async function saveFinancialMetrics(
	filingId: number,
	metrics: Record<string, any>
) {
	const pool = getPool();
	const promises = [];
	
	for (const [key, value] of Object.entries(metrics)) {
		if (value === null || value === undefined) continue;
		
		const isNumber = typeof value === "number";
		promises.push(
			pool.query(
				`INSERT INTO financial_metrics (filing_id, metric_name, metric_value, metric_text) VALUES ($1, $2, $3, $4)`,
				[filingId, key, isNumber ? value : null, isNumber ? null : String(value)]
			)
		);
	}
	
	await Promise.all(promises);
}

export async function getFinancialMetrics(filingId: number) {
	const pool = getPool();
	const result = await pool.query(
		`SELECT metric_name, metric_value, metric_text FROM financial_metrics WHERE filing_id = $1`,
		[filingId]
	);
	
	const metrics: Record<string, any> = {};
	for (const row of result.rows) {
		metrics[row.metric_name] = row.metric_value || row.metric_text;
	}
	return metrics;
}

// Embeddings status operations
export async function updateEmbeddingsStatus(
	filingId: number,
	totalChunks: number,
	embeddedChunks: number
) {
	const pool = getPool();
	await pool.query(
		`
		INSERT INTO embeddings_status (filing_id, total_chunks, embedded_chunks, last_embedded_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		ON CONFLICT (filing_id)
		DO UPDATE SET
			total_chunks = EXCLUDED.total_chunks,
			embedded_chunks = EXCLUDED.embedded_chunks,
			last_embedded_at = NOW(),
			updated_at = NOW();
		`,
		[filingId, totalChunks, embeddedChunks]
	);
}

export async function getEmbeddingsStatus(filingId: number) {
	const pool = getPool();
	const result = await pool.query(
		`SELECT * FROM embeddings_status WHERE filing_id = $1`,
		[filingId]
	);
	return result.rows[0] || null;
}

