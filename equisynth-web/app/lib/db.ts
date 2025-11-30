import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool | null {
	if (!process.env.DATABASE_URL) {
		return null;
	}
	if (!pool) {
		pool = new Pool({
			connectionString: process.env.DATABASE_URL,
		});
	}
	return pool;
}

export async function initializeDatabase() {
	const pool = getPool();
	if (!pool) {
		throw new Error("DATABASE_URL not configured");
	}
	
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

	// Create conversation_sessions table
	await pool.query(`
		CREATE TABLE IF NOT EXISTS conversation_sessions (
			id SERIAL PRIMARY KEY,
			user_id VARCHAR(255) NOT NULL,
			ticker VARCHAR(10),
			form VARCHAR(10),
			filed VARCHAR(20),
			title VARCHAR(255),
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		);
	`);

	// Create messages table
	await pool.query(`
		CREATE TABLE IF NOT EXISTS messages (
			id SERIAL PRIMARY KEY,
			session_id INTEGER REFERENCES conversation_sessions(id) ON DELETE CASCADE,
			role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
			content TEXT NOT NULL,
			sources INTEGER,
			error TEXT,
			created_at TIMESTAMP DEFAULT NOW()
		);
	`);

	// Create indexes for conversation tables
	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_sessions_user ON conversation_sessions(user_id);
		CREATE INDEX IF NOT EXISTS idx_sessions_created ON conversation_sessions(created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
		CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
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

// Conversation operations
export async function createConversationSession(data: {
	userId: string;
	ticker?: string;
	form?: string;
	filed?: string;
	title?: string;
}) {
	const pool = getPool();
	if (!pool) {
		throw new Error("Database not configured. Please set DATABASE_URL in environment variables.");
	}
	const result = await pool.query(
		`INSERT INTO conversation_sessions (user_id, ticker, form, filed, title, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		 RETURNING *`,
		[data.userId, data.ticker || null, data.form || null, data.filed || null, data.title || null]
	);
	return result.rows[0];
}

export async function updateConversationTitle(sessionId: number, title: string) {
	const pool = getPool();
	if (!pool) {
		throw new Error("Database not configured");
	}
	await pool.query(
		`UPDATE conversation_sessions SET title = $1, updated_at = NOW() WHERE id = $2`,
		[title, sessionId]
	);
}

export async function getConversationSessions(userId: string, limit: number = 50) {
	const pool = getPool();
	if (!pool) {
		return [];
	}
	const result = await pool.query(
		`SELECT id, user_id, ticker, form, filed, title, created_at, updated_at
		 FROM conversation_sessions
		 WHERE user_id = $1
		 ORDER BY updated_at DESC
		 LIMIT $2`,
		[userId, limit]
	);
	return result.rows;
}

export async function getConversationSession(sessionId: number, userId: string) {
	const pool = getPool();
	if (!pool) {
		return null;
	}
	const result = await pool.query(
		`SELECT * FROM conversation_sessions WHERE id = $1 AND user_id = $2`,
		[sessionId, userId]
	);
	return result.rows[0] || null;
}

export async function saveMessage(data: {
	sessionId: number;
	role: "user" | "assistant";
	content: string;
	sources?: number;
	error?: string;
}) {
	const pool = getPool();
	if (!pool) {
		// Silently fail if database not configured - allow chat to work without DB
		return null;
	}
	const result = await pool.query(
		`INSERT INTO messages (session_id, role, content, sources, error, created_at)
		 VALUES ($1, $2, $3, $4, $5, NOW())
		 RETURNING *`,
		[data.sessionId, data.role, data.content, data.sources || null, data.error || null]
	);
	
	// Update session's updated_at timestamp
	await pool.query(
		`UPDATE conversation_sessions SET updated_at = NOW() WHERE id = $1`,
		[data.sessionId]
	);
	
	return result.rows[0] || null;
}

export async function getMessages(sessionId: number, userId: string) {
	const pool = getPool();
	if (!pool) {
		return [];
	}
	// Verify session belongs to user
	const session = await getConversationSession(sessionId, userId);
	if (!session) {
		return [];
	}
	
	const result = await pool.query(
		`SELECT id, role, content, sources, error, created_at
		 FROM messages
		 WHERE session_id = $1
		 ORDER BY created_at ASC`,
		[sessionId]
	);
	return result.rows;
}

export async function deleteConversationSession(sessionId: number, userId: string) {
	const pool = getPool();
	if (!pool) {
		return false;
	}
	// Verify session belongs to user before deleting
	const session = await getConversationSession(sessionId, userId);
	if (!session) {
		return false;
	}
	
	await pool.query(
		`DELETE FROM conversation_sessions WHERE id = $1`,
		[sessionId]
	);
	return true;
}

