import Image from "next/image";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to EquiSynth</h1>
      <p className="text-gray-600">
        Sign in with your Google account to start building equity research reports.
      </p>
      <ul className="list-disc pl-6 text-gray-700">
        <li>Secure Google authentication</li>
        <li>Multi-agent pipeline for data extraction, analysis and reporting</li>
        <li>Export to PDF/Markdown/JSON (coming next)</li>
      </ul>
    </div>
  );
}
