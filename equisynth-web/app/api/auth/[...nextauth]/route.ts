import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const runtime = "nodejs";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
	console.error("[NextAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
}

const handler = NextAuth({
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		}),
	],
	pages: {
		signIn: "/",
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			if (session?.user) {
				(session.user as any).id = token.sub;
			}
			return session;
		},
		async redirect({ url, baseUrl }) {
			// Allow relative callback URLs
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			// Allow callback URLs on the same origin
			if (new URL(url).origin === baseUrl) return url;
			return baseUrl;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
