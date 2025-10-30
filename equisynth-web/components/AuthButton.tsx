"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
	const { status, data } = useSession();

	if (status === "loading") {
		return (
			<button className="px-4 py-2 rounded bg-gray-200 text-gray-700" disabled>
				Loading...
			</button>
		);
	}

	if (status === "authenticated") {
		return (
			<div className="flex items-center gap-3">
				<span className="text-sm text-gray-600">{data.user?.email}</span>
				<button
					className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-black"
					onClick={() => signOut()}
				>
					Sign out
				</button>
			</div>
		);
	}

	return (
		<button
			className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-black"
			onClick={() => signIn("google")}
		>
			Sign in with Google
		</button>
	);
}
