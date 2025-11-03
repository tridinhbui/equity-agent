'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import AgentSurface from '@/components/AgentSurface';

interface ValidationIssue {
	severity: 'error' | 'warning' | 'info';
	category: string;
	message: string;
	suggestion?: string;
}

interface ValidationResult {
	agent: string;
	passed: boolean;
	score: number;
	issues: ValidationIssue[];
	warnings: string[];
}

interface ValidationResponse {
	validatedAt: string;
	ticker: string;
	form: string;
	filed: string;
	overall: {
		passed: boolean;
		score: number;
		agentsPassed: number;
		totalAgents: number;
	};
	agents: ValidationResult[];
}

export default function SupervisorPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [ticker, setTicker] = useState('AAPL');
	const [form, setForm] = useState('10-K');
	const [filed, setFiled] = useState('2024-11-01');
	const [loading, setLoading] = useState(false);
	const [validation, setValidation] = useState<ValidationResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Redirect if not authenticated
	if (status === 'loading') {
		return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">Loading...</div>;
	}

	if (status === 'unauthenticated') {
		router.push('/login');
		return null;
	}

	const handleValidate = async () => {
		setLoading(true);
		setError(null);
		setValidation(null);

		try {
			const res = await fetch('/api/supervisor/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ticker, form, filed }),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Failed to validate agents');
			}

			const data = await res.json();
			setValidation(data);
		} catch (err: any) {
			setError(err?.message || 'Failed to validate agents');
		} finally {
			setLoading(false);
		}
	};

	const getScoreColor = (score: number) => {
		if (score >= 80) return 'text-green-400';
		if (score >= 60) return 'text-yellow-400';
		return 'text-red-400';
	};

	const getSeverityColor = (severity: string) => {
		if (severity === 'error') return 'bg-red-500/20 border-red-500/50 text-red-200';
		if (severity === 'warning') return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200';
		return 'bg-blue-500/20 border-blue-500/50 text-blue-200';
	};

	const getSeverityIcon = (severity: string) => {
		if (severity === 'error') return '❌';
		if (severity === 'warning') return '⚠️';
		return 'ℹ️';
	};

	return (
		<AppShell>
			<div className="bg-grid max-w-7xl mx-auto px-4 md:px-6">
				<div className="agent-indigo">
					<AgentSurface
						title="🔍 Supervisor Agent"
						subtitle="Monitor and validate outputs from all agents. Identify issues and ensure quality."
						className="mt-6"
					>
						<div className="glass-card p-6 md:p-8">
							<h2 className="text-2xl font-bold mb-6 text-gray-900">Validation Parameters</h2>
							
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Ticker
									</label>
									<input
										type="text"
										value={ticker}
										onChange={(e) => setTicker(e.target.value.toUpperCase())}
										className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 ring-agent focus:outline-none transition-all"
										placeholder="AAPL"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Form Type
									</label>
									<select
										value={form}
										onChange={(e) => setForm(e.target.value)}
										className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 ring-agent focus:outline-none transition-all"
									>
										<option value="10-K">10-K</option>
										<option value="10-Q">10-Q</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Filed Date
									</label>
									<input
										type="date"
										value={filed}
										onChange={(e) => setFiled(e.target.value)}
										className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 ring-agent focus:outline-none transition-all"
									/>
								</div>
							</div>

							<button
								onClick={handleValidate}
								disabled={loading}
								className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl focus:ring-2 ring-agent focus:outline-none"
							>
								{loading ? '🔄 Validating...' : '🔍 Validate All Agents'}
							</button>

			{error && (
				<div className="mt-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
					<p className="text-red-700 font-medium">❌ {error}</p>
				</div>
			)}
		</div>
	</AgentSurface>				{/* Validation Results */}
				{validation && (
					<div className="space-y-6 mt-6">
						{/* Overall Summary */}
						<div className="glass-card p-6 md:p-8">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">📊 Overall Quality Assessment</h2>
						
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
							<div className="bg-indigo-50 rounded-xl p-6">
								<p className="text-gray-600 text-sm mb-2">Overall Score</p>
								<p className={`text-5xl font-bold mb-2`}>
									{validation.overall.score.toFixed(1)}
								</p>
								<p className="text-gray-700 text-sm">/ 100</p>
							</div>

							<div className="bg-blue-50 rounded-xl p-6">
								<p className="text-gray-600 text-sm mb-2">Status</p>
								<p className={`text-4xl font-bold mb-2 ${validation.overall.passed ? 'text-green-600' : 'text-red-600'}`}>
									{validation.overall.passed ? '✅ PASS' : '❌ FAIL'}
								</p>
								<p className="text-gray-700 text-sm">
									{validation.overall.agentsPassed} / {validation.overall.totalAgents} agents passed
								</p>
							</div>

							<div className="bg-violet-50 rounded-xl p-6">
								<p className="text-gray-600 text-sm mb-2">Validated</p>
								<p className="text-2xl font-bold mb-2 text-gray-900">
									{new Date(validation.validatedAt).toLocaleString()}
								</p>
							<p className="text-gray-700 text-sm">
								{validation.ticker} | {validation.form} | {validation.filed}
							</p>
						</div>
					</div>
				</div>

				{/* Agent-by-Agent Results */}
				<div className="glass-card p-6 md:p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">🤖 Agent Validation Results</h2>					<div className="space-y-4">
						{validation.agents.map((agent, idx) => (
							<div
								key={idx}
								className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border-l-4 border-indigo-500"
							>
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-xl font-bold text-gray-900">{agent.agent}</h3>
									<div className="flex items-center gap-4">
										<div>
											<p className="text-gray-600 text-sm">Score</p>
											<p className={`text-2xl font-bold`}>
												{agent.score.toFixed(1)}
											</p>
										</div>
										<div>
											<p className="text-gray-600 text-sm">Status</p>
											<p className={`text-lg font-bold ${agent.passed ? 'text-green-600' : 'text-red-600'}`}>
												{agent.passed ? '✅ PASS' : '❌ FAIL'}
											</p>
										</div>
									</div>
								</div>

								{/* Issues */}
								{agent.issues.length > 0 && (
									<div className="mt-4 space-y-2">
										<p className="text-sm font-semibold text-gray-700 mb-2">Issues:</p>
										{agent.issues.map((issue, issueIdx) => (
											<div
												key={issueIdx}
												className={`p-3 rounded-lg border bg-white ${issue.severity === 'error' ? 'border-red-300' : issue.severity === 'warning' ? 'border-yellow-300' : 'border-blue-300'}`}
											>
												<div className="flex items-start gap-2">
													<span className="text-xl">{getSeverityIcon(issue.severity)}</span>
													<div className="flex-1">
														<p className="font-semibold text-gray-900">{issue.category}</p>
														<p className="text-sm mt-1 text-gray-700">{issue.message}</p>
														{issue.suggestion && (
															<p className="text-xs mt-1 text-gray-600">💡 {issue.suggestion}</p>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								)}

								{/* Warnings */}
								{agent.warnings.length > 0 && (
									<div className="mt-4">
										<p className="text-sm font-semibold text-amber-700 mb-2">⚠️ Warnings:</p>
										<ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
											{agent.warnings.map((warning, warnIdx) => (
												<li key={warnIdx}>{warning}</li>
											))}
										</ul>
									</div>
								)}

							{agent.issues.length === 0 && agent.warnings.length === 0 && (
								<p className="text-green-600 text-sm mt-2">✅ No issues found</p>
							)}
					</div>
				))}
			</div>
		</div>
	</div>
	)}
		</div>
	</div>
</AppShell>
);
}