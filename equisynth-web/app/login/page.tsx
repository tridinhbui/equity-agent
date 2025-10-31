"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
	return (
		<div className="min-h-screen bg-white flex items-center justify-center px-4">
			<div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
				<div className="flex items-center gap-3 mb-6 justify-center">
					<img src="/equisynth-logo.png" alt="EquiSynth logo" className="h-10 w-10" />
					<h1 className="text-2xl font-semibold">EquiSynth</h1>
				</div>
				<p className="text-gray-700 text-center mb-6">
					Deep Equity Agent tự động hoá nghiên cứu cổ phiếu: đọc hiểu tài liệu, kết nối dữ liệu realtime, phân tích sentiment và định giá để xuất báo cáo có thể truy vết nguồn.
				</p>
				<ul className="text-sm text-gray-700 space-y-2 mb-6">
					<li>• Đọc 10‑K/10‑Q, transcript, investor deck</li>
					<li>• Dữ liệu realtime: giá, fundamentals, macro</li>
					<li>• Sentiment & Tone: FinBERT & embeddings</li>
					<li>• Định giá tự động: DCF, EV/EBITDA, multiples</li>
				</ul>
				<button
					className="w-full px-6 py-3 rounded-lg bg-gray-900 text-white hover:bg-black transition"
					onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
				>
					Sign in with Google
				</button>
				<p className="text-xs text-gray-500 mt-3 text-center">Tiếp tục tức là bạn đồng ý với điều khoản của EquiSynth.</p>
			</div>
		</div>
	);
}
