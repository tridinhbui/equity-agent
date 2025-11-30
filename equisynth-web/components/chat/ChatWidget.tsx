"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Clock, Plus } from "lucide-react";
import { useSession } from "next-auth/react";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	sources?: number;
	error?: string;
}

interface ConversationSession {
	id: number;
	user_id: string;
	ticker?: string;
	form?: string;
	filed?: string;
	title?: string;
	created_at: string;
	updated_at: string;
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
	const { data: session } = useSession();
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
	const [conversations, setConversations] = useState<ConversationSession[]>([]);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [loadingConversation, setLoadingConversation] = useState(false);
	const [dbStatus, setDbStatus] = useState<"connected" | "error" | "unknown">("unknown");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const historyRef = useRef<HTMLDivElement>(null);

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

	// Load conversation history when widget opens
	useEffect(() => {
		if (isOpen) {
			loadConversationHistory();
		}
	}, [isOpen]);

	// Close history dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				historyRef.current &&
				!historyRef.current.contains(event.target as Node)
			) {
				setHistoryOpen(false);
			}
		};

		if (historyOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [historyOpen]);

	const loadConversationHistory = async () => {
		// Allow loading history even without session (for dev/testing)
		setLoadingHistory(true);
		try {
			const res = await fetch("/api/chat/sessions");
			if (res.ok) {
				const data = await res.json();
				setConversations(data.sessions || []);
				setDbStatus("connected");
			} else {
				const errorData = await res.json().catch(() => ({}));
				console.error("[loadConversationHistory] API error:", errorData);
				setDbStatus("error");
				if (errorData.error?.includes("Database not configured")) {
					setConversations([]);
				}
			}
		} catch (err) {
			console.error("[loadConversationHistory] Exception:", err);
			setDbStatus("error");
			setConversations([]);
		} finally {
			setLoadingHistory(false);
		}
	};

	const createNewSession = async (): Promise<number | null> => {
		// Get userId with fallback for dev/testing
		let userId: string | null = null;
		if (session?.user) {
			userId = (session.user as any).id || session.user.email || null;
		}
		
		// Fallback to localStorage for dev/testing
		if (!userId) {
			const tempUserId = localStorage.getItem('temp_user_id');
			if (tempUserId) {
				userId = tempUserId;
			} else {
				userId = `temp-user-${Date.now()}`;
				localStorage.setItem('temp_user_id', userId);
			}
			console.warn("[createNewSession] Using fallback userId:", userId);
		}

		try {
			// Generate a title from the first message if available
			const title = input.trim()
				? `${input.trim().substring(0, 50)}${input.trim().length > 50 ? "..." : ""}`
				: `Chat about ${ticker} ${form}`;

			console.log("[createNewSession] Creating session with userId:", userId);

			const res = await fetch("/api/chat/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ticker,
					form,
					filed,
					title,
					userId, // Include userId in body for fallback
				}),
			});

			if (res.ok) {
				const data = await res.json();
				if (data.session && data.session.id) {
					console.log("[createNewSession] ✅ Session created:", data.session.id);
					setDbStatus("connected");
					return data.session.id;
				} else {
					throw new Error("Session creation returned invalid response");
				}
			} else {
				const errorData = await res.json().catch(() => ({}));
				console.error("[createNewSession] ❌ API error:", errorData);
				setDbStatus("error");
				
				// Show specific error message
				const errorMessage = errorData.error || "Failed to create session";
				const errorCode = errorData.code || "UNKNOWN";
				
				if (errorCode === "DATABASE_NOT_CONFIGURED") {
					throw new Error("Database not configured. Please set DATABASE_URL in .env.local");
				} else if (errorCode === "DATABASE_INIT_FAILED" || errorCode === "DATABASE_ERROR") {
					throw new Error("Database connection failed. Please check your database configuration.");
				} else {
					throw new Error(errorMessage);
				}
			}
		} catch (err: any) {
			console.error("[createNewSession] ❌ Exception:", err);
			setDbStatus("error");
			throw err; // Re-throw to be caught by caller
		}
	};

	const saveMessage = async (
		sessionId: number | null,
		role: "user" | "assistant",
		content: string,
		sources?: number,
		error?: string
	) => {
		if (!sessionId || !session?.user) return; // Skip if no session or user

		try {
			const res = await fetch("/api/chat/messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionId,
					role,
					content,
					sources,
					error,
				}),
			});
			if (!res.ok) {
				// Silently fail if database not configured
				const errorData = await res.json().catch(() => ({}));
				if (!errorData.error?.includes("Database not configured")) {
					console.error("Failed to save message:", errorData.error);
				}
			}
		} catch (err) {
			// Silently fail - chat should work even without database
			console.warn("Failed to save message (database may not be configured):", err);
		}
	};

	const loadConversation = async (sessionId: number) => {
		if (!session?.user) return;

		setLoadingConversation(true);
		setHistoryOpen(false);
		setMessages([]);

		try {
			const res = await fetch(`/api/chat/sessions/${sessionId}`);
			if (res.ok) {
				const data = await res.json();
				const loadedMessages: Message[] = data.messages.map((msg: any) => ({
					id: msg.id.toString(),
					role: msg.role,
					content: msg.content,
					timestamp: new Date(msg.created_at),
					sources: msg.sources,
					error: msg.error,
				}));
				setMessages(loadedMessages);
				setActiveSessionId(sessionId);
			} else {
				const errorData = await res.json().catch(() => ({}));
				console.error("Failed to load conversation:", errorData.error);
			}
		} catch (err) {
			console.error("Failed to load conversation:", err);
		} finally {
			setLoadingConversation(false);
		}
	};

	const handleNewChat = async () => {
		console.log("[handleNewChat] Starting new chat...");
		setMessages([]);
		setActiveSessionId(null);
		setHistoryOpen(false);
		setInput("");
		
		// CRITICAL: Immediately refresh history to show the session that just finished
		console.log("[handleNewChat] Refreshing conversation history...");
		await loadConversationHistory();
		console.log("[handleNewChat] History refreshed");
	};

	const handleSend = async () => {
		if (!input.trim() || loading || !filed) return;

		// CRITICAL: Ensure we have a valid sessionId before proceeding
		let sessionId = activeSessionId;
		
		if (!sessionId) {
			console.log("[handleSend] No active session, creating new one...");
			try {
				sessionId = await createNewSession();
				if (!sessionId) {
					// Session creation failed - STOP and show error
					alert("Cannot save chat: Database Error. Please check your database configuration.");
					return; // STOP - don't allow chat if history cannot be saved
				}
				setActiveSessionId(sessionId);
				await loadConversationHistory(); // Refresh history after creating session
			} catch (err: any) {
				// Session creation threw an error - STOP and show error
				console.error("[handleSend] Failed to create session:", err);
				alert(`Cannot save chat: ${err.message || "Database Error"}`);
				return; // STOP - don't allow chat if history cannot be saved
			}
		}

		// CRITICAL: Verify sessionId exists before saving message
		if (!sessionId) {
			console.error("[handleSend] ❌ sessionId is null after creation attempt");
			alert("Cannot save chat: Session ID is missing. Please try again.");
			return;
		}

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: input.trim(),
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		
		// Save user message - sessionId is guaranteed to be non-null here
		await saveMessage(sessionId, "user", input.trim());
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
			
			// CRITICAL: Verify sessionId before saving assistant message
			if (sessionId) {
				await saveMessage(
					sessionId,
					"assistant",
					chatData.answer,
					chatData.sources
				);
				// Refresh history after saving to show updated conversation
				await loadConversationHistory();
			} else {
				console.error("[handleSend] ❌ Cannot save assistant message - sessionId is null");
			}
		} catch (err: any) {
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: `Sorry, I encountered an error: ${err.message || "Unknown error"}`,
				timestamp: new Date(),
				error: err.message,
			};
			setMessages((prev) => [...prev, errorMessage]);
			
			// CRITICAL: Verify sessionId before saving error message
			if (sessionId) {
				await saveMessage(
					sessionId,
					"assistant",
					errorMessage.content,
					undefined,
					err.message
				);
			} else {
				console.error("[handleSend] ❌ Cannot save error message - sessionId is null");
			}
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

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-[24rem] h-[calc(100vh-6rem)] sm:h-[600px] max-h-[calc(100vh-6rem)] sm:max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
			{/* Header */}
			<div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between relative">
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-lg">💬 AI Assistant</h3>
					<p className="text-xs text-blue-100 mt-0.5 truncate">
						{ticker ? `Ask questions about ${ticker} ${form || ""}` : "Ask questions about the filing"}
					</p>
				</div>
				<div className="relative" ref={historyRef}>
					<button
						onClick={() => setHistoryOpen(!historyOpen)}
						className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
						aria-label="Conversation history"
					>
						<Clock className="w-5 h-5" />
					</button>

					{/* History Dropdown */}
					{historyOpen && (
						<div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
							<div className="p-2 border-b border-gray-200">
								<button
									onClick={handleNewChat}
									className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
								>
									<Plus className="w-4 h-4" />
									New Chat
								</button>
							</div>
							<div className="max-h-64 overflow-y-auto">
								{loadingHistory ? (
									<div className="p-4 text-center text-gray-500 text-sm">
										<Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
										Loading...
									</div>
								) : conversations.length === 0 ? (
									<div className="p-4 text-center text-gray-500 text-sm">
										No conversation history
									</div>
								) : (
									conversations.map((conv) => (
										<button
											key={conv.id}
											onClick={() => loadConversation(conv.id)}
											className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
												activeSessionId === conv.id ? "bg-blue-50" : ""
											}`}
										>
											<div className="font-medium text-gray-900 truncate">
												{conv.title || `Chat about ${conv.ticker || "filing"}`}
											</div>
											<div className="text-xs text-gray-500 mt-0.5">
												{formatDate(conv.updated_at)}
											</div>
										</button>
									))
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
				{loadingConversation && (
					<div className="text-center text-gray-500 mt-8">
						<Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
						<p className="text-sm">Loading conversation...</p>
					</div>
				)}

				{!loadingConversation && messages.length === 0 && (
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

				{!loadingConversation &&
					messages.map((message) => (
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
						disabled={loading || !filed || loadingConversation}
						className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
					/>
					<button
						onClick={handleSend}
						disabled={loading || !input.trim() || !filed || loadingConversation}
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
				
				{/* Debug Status Indicator (visible in dev mode - check window.location) */}
				{(typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) && (
					<div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono border border-gray-300">
						<div className="flex items-center gap-4 flex-wrap">
							<div>
								<span className="text-gray-600">SessionID:</span>{" "}
								<span className={activeSessionId ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
									{activeSessionId || "null"}
								</span>
							</div>
							<div>
								<span className="text-gray-600">DB Status:</span>{" "}
								<span className={
									dbStatus === "connected" ? "text-green-600 font-bold" :
									dbStatus === "error" ? "text-red-600 font-bold" :
									"text-yellow-600 font-bold"
								}>
									{dbStatus === "connected" ? "Connected" :
									 dbStatus === "error" ? "Error" :
									 "Unknown"}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
