"use client";
import React, { useState } from "react";

export default function DataExtractorPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    setLoading(true);
    // Simulate extraction
    setTimeout(() => {
      setResult("Extracted data: " + input);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Data Extractor Agent</h1>
        <textarea
          className="w-full border rounded-lg p-2 mb-4"
          rows={5}
          placeholder="Paste your financial data here..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold"
          onClick={handleExtract}
          disabled={loading || !input.trim()}
        >
          {loading ? "Extracting..." : "Extract Data"}
        </button>
        {result && <div className="mt-4 text-green-700">{result}</div>}
      </div>
    </div>
  );
}
