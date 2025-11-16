"use client";

import { usePathname, useRouter } from "next/navigation";

type Tab = { 
  key: string; 
  label: string; 
  icon: string; 
  path: string;
}

// News tabs - chỉ có Finance News
const NEWS_TABS: Tab[] = [
  { key: "finance-news", label: "Finance News", icon: "📰", path: "/finance-news" },
];

export default function NewsTabs() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="tabs">
      {/* Back button */}
      <button 
        className="tab"
        onClick={() => router.push('/main-dashboard')}
      >
        <span>←</span>
        <span>Back</span>
      </button>
      
      {NEWS_TABS.map(tab => (
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

