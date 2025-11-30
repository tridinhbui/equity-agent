"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	sources?: number;
	error?: string;
}

interface ChatWidgetProps {
	ticker: string;
	form: string;
	filed: string;
	isOpen: boolean;
	onClose: () => void;
}

export default function ChatWidget({
	ticker,
	form,
	filed,
	isOpen,
	onClose,
}: ChatWidgetProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Scroll to bottom when new messages are added
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Focus input when widget opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [isOpen]);

	const handleSend = async () => {
		if (!input.trim() || loading || !filed) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: input.trim(),
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);

		try {
			// First, get relevant context from RAG
			const isRiskQuestion = /risk\s+factors?|main\s+risks?|key\s+risks?/i.test(input);
			const queryForRAG = isRiskQuestion
				? `What are the main risk factors and potential risks for ${ticker}?`
				: input.trim();
			const topK = isRiskQuestion ? 10 : 5;

			const ragRes = await fetch("/api/rag/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ticker,
					form,
					filed,
					query: queryForRAG,
					topK,
				}),
			});

			const ragData = await ragRes.json();
			if (!ragRes.ok) throw new Error(ragData.error || "Query failed");

			// Then, send to chat API for natural language response
			const chatRes = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					question: input.trim(),
					context: ragData.results,
					ticker,
					form,
				}),
			});

			const chatData = await chatRes.json();
			if (!chatRes.ok) throw new Error(chatData.error || "Chat failed");

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: chatData.answer,
				timestamp: new Date(),
				sources: chatData.sources,
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} catch (err: any) {
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: `Sorry, I encountered an error: ${err.message || "Unknown error"}`,
				timestamp: new Date(),
				error: err.message,
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-[24rem] h-[calc(100vh-6rem)] sm:h-[600px] max-h-[calc(100vh-6rem)] sm:max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
			{/* Header */}
			<div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-lg">💬 AI Assistant</h3>
					<p className="text-xs text-blue-100 mt-0.5 truncate">
						{ticker ? `Ask questions about ${ticker} ${form || ""}` : "Ask questions about the filing"}
					</p>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
				{messages.length === 0 && (
					<div className="text-center text-gray-500 mt-8 px-4">
						<p className="text-sm font-medium">Start a conversation!</p>
						<p className="text-xs mt-2 text-gray-400">
							Try asking:
						</p>
						<ul className="text-xs mt-2 text-gray-400 space-y-1">
							<li>• "What are the main risk factors?"</li>
							<li>• "What is the revenue growth?"</li>
							<li>• "What are the key financial metrics?"</li>
						</ul>
					</div>
				)}

				{messages.map((message) => (
					<div
						key={message.id}
						className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[80%] rounded-lg px-4 py-2 ${
								message.role === "user"
									? "bg-blue-600 text-white"
									: message.error
									? "bg-red-50 text-red-800 border border-red-200"
									: "bg-white text-gray-800 border border-gray-200"
							}`}
						>
							<p className="text-sm whitespace-pre-wrap">{message.content}</p>
							{message.sources !== undefined && message.sources > 0 && (
								<p className="text-xs mt-1 opacity-70">
									Based on {message.sources} source{message.sources !== 1 ? "s" : ""}
								</p>
							)}
							{message.error && (
								<p className="text-xs mt-1 opacity-70">Error: {message.error}</p>
							)}
						</div>
					</div>
				))}

				{loading && (
					<div className="flex justify-start">
						<div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
							<Loader2 className="w-4 h-4 animate-spin text-blue-600" />
						</div>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
				<div className="flex gap-2">
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Ask a question..."
						disabled={loading || !filed}
						className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
					/>
					<button
						onClick={handleSend}
						disabled={loading || !input.trim() || !filed}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
					>
						{loading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
					</button>
				</div>
				{!filed && (
					<p className="text-xs text-gray-500 mt-2">
						Please fetch and process a filing first
					</p>
				)}
			</div>
		</div>
	);
}

