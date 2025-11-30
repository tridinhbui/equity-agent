"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

interface ChatBubbleProps {
	onClick: () => void;
	isOpen: boolean;
	unreadCount?: number;
}

export default function ChatBubble({ onClick, isOpen, unreadCount = 0 }: ChatBubbleProps) {
	return (
		<button
			onClick={onClick}
			className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
				isOpen
					? "bg-red-500 hover:bg-red-600 scale-95"
					: "bg-blue-600 hover:bg-blue-700 hover:scale-110 active:scale-95"
			}`}
			aria-label={isOpen ? "Close chat" : "Open chat"}
		>
			{isOpen ? (
				<X className="w-6 h-6 text-white" />
			) : (
				<>
					<MessageCircle className="w-6 h-6 text-white" />
					{unreadCount > 0 && (
						<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</>
			)}
		</button>
	);
}

