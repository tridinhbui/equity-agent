"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
	return (
		<div className="min-h-[60vh] flex items-center justify-center">
			<div className="w-full max-w-md rounded-lg border p-8 text-center space-y-6">
				<div className="flex items-center justify-center gap-2">
					<img src="/equisynth-logo.png" alt="EquiSynth logo" className="h-8 w-8" />
					<h1 className="text-2xl font-semibold">EquiSynth</h1>
				</div>
				<p className="text-gray-600">Đăng nhập bằng Google để bắt đầu.</p>
				<button
					className="w-full px-4 py-3 rounded bg-gray-900 text-white hover:bg-black"
					onClick={() => signIn("google", { callbackUrl: "/" })}
				>
					Sign in with Google
				</button>
			</div>
		</div>
	);
}
