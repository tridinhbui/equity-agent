import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	try {
		const { question, context, ticker, form } = await req.json();
		
		if (!question) {
			return NextResponse.json({ error: "Question is required" }, { status: 400 });
		}

		// Check if API key exists
		const apiKey = process.env.GROQ_API_KEY;
		if (!apiKey) {
			console.error("GROQ_API_KEY is not set in environment variables");
			return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
		}

		console.log("Using Groq API key:", apiKey.substring(0, 15) + "...");

		// Build the messages with context from RAG
		const systemMessage = "You are a financial analyst assistant helping users understand SEC filings. Provide clear, concise answers based on the provided excerpts.";
		
		let userMessage = "";
		if (context && context.length > 0) {
			userMessage += `Here are the most relevant excerpts from the ${form || "SEC filing"} for ${ticker || "the company"}:\n\n`;
			context.forEach((chunk: any, idx: number) => {
				userMessage += `[Excerpt ${idx + 1}]:\n${chunk.text}\n\n`;
			});
			userMessage += `---\n\n`;
		}
		userMessage += `User question: ${question}\n\n`;
		userMessage += `Please provide a clear, concise answer based on the filing excerpts above. If the excerpts don't contain enough information to answer the question, say so clearly.`;

		// Use Groq API (OpenAI-compatible endpoint)
		const response = await fetch(
			"https://api.groq.com/openai/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: "llama-3.3-70b-versatile", // Latest Llama model
					messages: [
						{ role: "system", content: systemMessage },
						{ role: "user", content: userMessage }
					],
					temperature: 0.7,
					max_tokens: 1024
				})
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			console.error("Groq API error:", errorData);
			throw new Error(errorData.error?.message || `API returned ${response.status}`);
		}

		const data = await response.json();
		const answer = data.choices?.[0]?.message?.content || "No response generated";

		return NextResponse.json({ 
			answer,
			sources: context?.length || 0
		});

	} catch (err: any) {
		console.error("Groq API error:", err);
		return NextResponse.json({ 
			error: err?.message || "Failed to generate response" 
		}, { status: 500 });
	}
}
