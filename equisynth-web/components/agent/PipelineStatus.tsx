"use client";

function Pill({ tone="gray", children }:{
  tone?: "gray" | "blue" | "green" | "purple" | "orange";
  children: React.ReactNode;
}) {
  const map = {
    gray:   "bg-gray-50 text-gray-700 border-gray-200",
    blue:   "bg-blue-50 text-blue-800 border-blue-200",
    green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    purple: "bg-purple-50 text-purple-800 border-purple-200",
    orange: "bg-orange-50 text-orange-800 border-orange-200",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${map[tone]}`}>
      {children}
    </span>
  );
}

export default function PipelineStatus({
  hasResult,
  hasIngest,
  hasSection,
  hasEmbed,
}: {
  hasResult: boolean;
  hasIngest: boolean;
  hasSection: boolean;
  hasEmbed: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
      <Pill tone={hasResult ? "blue" : "gray"}>{hasResult ? "✓ Fetched" : "Not fetched"}</Pill>
      <Pill tone={hasIngest ? "green" : "gray"}>{hasIngest ? "✓ Parsed" : "Not parsed"}</Pill>
      <Pill tone={hasSection ? "purple" : "gray"}>{hasSection ? "✓ Sectioned" : "Not sectioned"}</Pill>
      <Pill tone={hasEmbed ? "orange" : "gray"}>{hasEmbed ? "✓ Embedded" : "Not embedded"}</Pill>
    </div>
  );
}
