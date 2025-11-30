"use client";

import { useState } from "react";

export default function DbInitPage() {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	const handleInit = async () => {
		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const res = await fetch("/api/db/init", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await res.json();
			
			if (res.ok) {
				setResult(data);
			} else {
				setError(data.error || "Failed to initialize database");
			}
		} catch (err: any) {
			setError(err.message || "Unknown error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
				<h1 className="text-2xl font-bold mb-4">Database Initialization</h1>
				
				{!result && !error && (
					<div>
						<p className="text-gray-600 mb-4">
							Click the button below to initialize the database tables for conversation history.
						</p>
						<p className="text-sm text-gray-500 mb-4">
							Make sure you have set <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code> in your <code className="bg-gray-100 px-1 rounded">.env.local</code> file.
						</p>
						<button
							onClick={handleInit}
							disabled={loading}
							className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Initializing..." : "Initialize Database"}
						</button>
					</div>
				)}

				{result && (
					<div className="bg-green-50 border border-green-200 rounded-lg p-4">
						<h2 className="text-green-800 font-semibold mb-2">✅ Success!</h2>
						<p className="text-green-700 text-sm">{result.message || "Database initialized successfully"}</p>
						<button
							onClick={() => {
								setResult(null);
								setError(null);
							}}
							className="mt-4 text-sm text-green-600 hover:text-green-800 underline"
						>
							Initialize Again
						</button>
					</div>
				)}

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4">
						<h2 className="text-red-800 font-semibold mb-2">❌ Error</h2>
						<p className="text-red-700 text-sm mb-2">{error}</p>
						{error.includes("DATABASE_URL") && (
							<div className="mt-3 text-xs text-red-600 bg-red-100 p-2 rounded">
								<p className="font-semibold mb-1">To fix this:</p>
								<ol className="list-decimal list-inside space-y-1">
									<li>Open <code className="bg-red-200 px-1 rounded">.env.local</code> in your project root</li>
									<li>Add: <code className="bg-red-200 px-1 rounded">DATABASE_URL=postgresql://user:password@localhost:5432/equisynth</code></li>
									<li>Replace with your actual database credentials</li>
									<li>Restart your dev server</li>
									<li>Try again</li>
								</ol>
							</div>
						)}
						<button
							onClick={() => {
								setResult(null);
								setError(null);
							}}
							className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
						>
							Try Again
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

