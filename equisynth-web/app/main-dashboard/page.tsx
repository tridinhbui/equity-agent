"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Newspaper, Settings, Bell, TrendingUp, BarChart3, Zap, Clock, FileText, PieChart, Database, ArrowUpRight, CheckCircle2, Activity, Search, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Generate sparkline data
const generateSparklineData = (trend: 'up' | 'down' | 'volatile') => {
  const data = [];
  let value = 100;
  for (let i = 0; i < 20; i++) {
    if (trend === 'up') value += Math.random() * 3 - 1;
    else if (trend === 'down') value -= Math.random() * 3 - 1;
    else value += Math.random() * 6 - 3;
    data.push({ value: Math.max(85, Math.min(115, value)) });
  }
  return data;
};

// Simple Sparkline Component
const Sparkline = ({ data, color }: { data: Array<{ value: number }>, color: string }) => {
  const width = 100;
  const height = 32;
  const padding = 4;
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="w-full h-full overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function MainDashboard() {
  const { data: session } = useSession();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const router = useRouter();

  const handleCardClick = (destination: string) => {
    if (destination === 'ai-agents') {
      router.push('/dashboard');
    } else if (destination === 'finance-news') {
      router.push('/finance-news');
    }
  };

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const marketData = [
    { symbol: 'AAPL', change: '+1.23%', positive: true },
    { symbol: 'TSLA', change: '-0.87%', positive: false },
    { symbol: '^GSPC', change: '+0.42%', positive: true },
    { symbol: 'NVDA', change: '+2.15%', positive: true },
    { symbol: 'MSFT', change: '+0.68%', positive: true },
    { symbol: 'GOOGL', change: '-0.34%', positive: false },
  ];

  const sparklineData = {
    sp500: generateSparklineData('up'),
    vix: generateSparklineData('volatile'),
    nvda: generateSparklineData('up')
  };

  const recentActivity = [
    { id: 1, title: 'NVDA Q3 valuation generated', time: '30s ago', icon: BarChart3, color: 'text-green-600', bg: 'bg-green-100' },
    { id: 2, title: '10-K extraction completed for AAPL', time: '2m ago', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 3, title: 'New macro insights report available', time: '5m ago', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 4, title: 'Sentiment analysis: Tech sector bullish', time: '12m ago', icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-100' }
  ];

  const exploreTools = [
    { id: 1, title: 'Financial Models', desc: 'DCF, Comps, LBO', icon: PieChart, gradient: 'from-[#4A90E2] to-[#7BB3FF]' },
    { id: 2, title: 'Industry Benchmarks', desc: 'Peer analysis', icon: BarChart3, gradient: 'from-[#6B8DD6] to-[#8FA8E0]' },
    { id: 3, title: 'Automated Reports', desc: 'Custom exports', icon: FileText, gradient: 'from-[#5C9DE5] to-[#7DB4F0]' },
    { id: 4, title: 'SEC Filings Parser', desc: 'Real-time data', icon: Database, gradient: 'from-[#4E95E0] to-[#72ACEC]' }
  ];

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'JD';

  return (
    <div className="min-h-screen bg-[#F0F4FA] font-sans text-slate-900 selection:bg-[#4A90E2]/20">

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#4A90E2] to-[#7BB3FF] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">EquiSynth</h1>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Intelligence Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Market Ticker - Compact */}
          <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-slate-50 rounded-full border border-slate-200/60">
            {marketData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-medium">
                <span className="text-slate-600">{item.symbol}</span>
                <span className={item.positive ? 'text-emerald-600' : 'text-rose-600'}>{item.change}</span>
              </div>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-medium text-slate-700">{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              <div className="text-[10px] text-slate-400">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#7BB3FF] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform overflow-hidden">
              {session?.user?.image ? (
                <img src={session.user.image} alt={session.user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8">

        {/* Hero Section */}
        <section className="relative rounded-[2.5rem] overflow-hidden bg-white shadow-xl shadow-slate-200/50 border border-white/50">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E7F1FF] via-[#F8FAFF] to-[#DCEAFB] opacity-50"></div>

          {/* Decorative Blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

          <div className="relative z-10 px-8 py-12 lg:py-20 text-center">

            <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4A90E2] to-[#7BB3FF]">{session?.user?.name || 'User'}</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Your intelligent financial workspace is ready. You have <span className="font-semibold text-slate-900">8 active agents</span> analyzing market data in real-time.
            </p>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-12">
              {[
                { label: '10-K Filings Tracked', value: '12,450+', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Active AI Agents', value: '8', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Equities Covered', value: '5,200+', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/80 transition-colors shadow-sm">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Actions Grid (Bento Style) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* AI Agents Card - Large */}
          <div
            onClick={() => handleCardClick('ai-agents')}
            className="lg:col-span-7 group relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-lg shadow-slate-200/40 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110 origin-top-right">
              <Sparkles className="w-64 h-64 text-[#4A90E2]" />
            </div>

            <div className="relative z-10 p-8 h-full flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#4A90E2] flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3 group-hover:text-[#4A90E2] transition-colors">AI Agents</h3>
                <p className="text-slate-600 text-lg max-w-md leading-relaxed">
                  Deploy autonomous agents for deep financial analysis, valuation modeling, and risk assessment.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-8">
                <span className="text-sm font-semibold text-[#4A90E2] group-hover:underline">Launch Workspace</span>
                <ArrowUpRight className="w-4 h-4 text-[#4A90E2] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
            </div>
          </div>

          {/* Finance News Card - Medium */}
          <div
            onClick={() => handleCardClick('finance-news')}
            className="lg:col-span-5 group relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-lg shadow-slate-200/40 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110 origin-top-right">
              <Newspaper className="w-64 h-64 text-indigo-500" />
            </div>

            <div className="relative z-10 p-8 h-full flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Newspaper className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3 group-hover:text-indigo-500 transition-colors">Finance News</h3>
                <p className="text-slate-600 text-lg max-w-xs leading-relaxed">
                  Real-time market intelligence and sentiment analysis from global sources.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-8">
                <span className="text-sm font-semibold text-indigo-500 group-hover:underline">View Feed</span>
                <ArrowUpRight className="w-4 h-4 text-indigo-500 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Section: Activity & Tools */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Activity Feed */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
              <button className="text-sm font-medium text-[#4A90E2] hover:text-[#357ABD] transition-colors">View All</button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className={`w-12 h-12 rounded-xl ${activity.bg} flex items-center justify-center shrink-0`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{activity.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.time} · Automated System</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white rounded-lg shadow-sm border border-slate-200 text-slate-400 hover:text-[#4A90E2]">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explore Tools Mini-Grid */}
          <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <h3 className="text-xl font-bold mb-6 relative z-10">Explore Tools</h3>

            <div className="grid grid-cols-1 gap-3 relative z-10">
              {exploreTools.map((tool) => (
                <button key={tool.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/5 text-left group">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg`}>
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold group-hover:text-blue-200 transition-colors">{tool.title}</div>
                    <div className="text-[10px] text-slate-400">{tool.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <button className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                View All Applications
              </button>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
