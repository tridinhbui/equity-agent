"use client";

import { usePathname, useRouter } from "next/navigation";

type Tab = { 
  key: string; 
  label: string; 
  icon: string; 
  path: string;
}

const AGENT_TABS: Tab[] = [
  { key: "dashboard", label: "Data Extractor", icon: "📊", path: "/dashboard" },
  { key: "financial", label: "Financial Understanding", icon: "💡", path: "/financial-understanding" },
  { key: "valuation", label: "Valuation", icon: "💰", path: "/valuation" },
  { key: "sentiment", label: "Sentiment & Tone", icon: "🎭", path: "/sentiment" },
  { key: "report", label: "Report Composer", icon: "📄", path: "/report" },
  { key: "supervisor", label: "Supervisor", icon: "🔍", path: "/supervisor" },
];

export default function AgentTabs() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="tabs">
      {AGENT_TABS.map(tab => (
        <button 
          key={tab.key} 
          className={`tab ${pathname === tab.path ? 'tab--active' : ''}`} 
          onClick={() => router.push(tab.path)}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
