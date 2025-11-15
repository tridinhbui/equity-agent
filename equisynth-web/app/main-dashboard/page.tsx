"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Newspaper } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

export default function MainDashboard() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [tickerPosition, setTickerPosition] = useState(0);
  const router = useRouter();

  const handleCardClick = (destination: string) => {
    if (destination === 'ai-agents') {
      // Navigate to dashboard (first agent tab)
      router.push('/dashboard');
    } else if (destination === 'finance-news') {
      // Navigate to finance news
      router.push('/finance-news');
    }
  };

  // Market ticker animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPosition((prev) => (prev <= -50 ? 0 : prev - 0.1));
    }, 50);
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background - Fixed to cover entire viewport */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#F0F5FF] via-[#F5F9FF] to-[#FAFCFF] -z-10">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.01]">
          <div 
            className="w-full h-full" 
            style={{
              backgroundImage: `
                linear-gradient(to right, #6BA3E8 1px, transparent 1px),
                linear-gradient(to bottom, #6BA3E8 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          ></div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-40 -left-20 w-72 h-72 bg-[#D7E5FF] rounded-full opacity-15 blur-3xl"></div>
          <div className="absolute bottom-32 right-10 w-96 h-96 bg-[#E2EDFF] rounded-full opacity-12 blur-3xl"></div>
          <div className="absolute top-2/3 right-1/3 w-80 h-80 bg-[#EDF3FF] rounded-full opacity-10 blur-3xl"></div>
        </div>
      </div>

      <AppShell showTabs={false}>
        {/* Main Content */}
        <main className="relative z-10 container mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-[36px] mb-1.5 text-gray-950 tracking-tight">
              Welcome to EquiSynth
            </h1>
            <p className="text-[14px] text-[#6B7F99]/75">
              Choose your workspace to get started.
            </p>
          </div>

          {/* Market Ticker Strip */}
          <div className="max-w-3xl mx-auto mb-10 overflow-hidden bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/30 shadow-sm">
            <div className="py-3 px-4 overflow-hidden">
              <div 
                className="flex items-center space-x-8 whitespace-nowrap"
                style={{ transform: `translateX(${tickerPosition}%)` }}
              >
                {[...marketData, ...marketData].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-700">{item.symbol}</span>
                    <span className={item.positive ? 'text-green-600' : 'text-red-600'}>
                      {item.change}
                    </span>
                    {idx < marketData.length * 2 - 1 && (
                      <span className="text-gray-300 ml-6">•</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selection Cards */}
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 px-4 mb-12">
            {/* AI Agents Card */}
            <button
              onClick={() => handleCardClick('ai-agents')}
              onMouseEnter={() => setHoveredCard('agents')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative bg-white/85 backdrop-blur-sm rounded-3xl p-10 shadow-md hover:shadow-xl transition-all duration-300 text-center"
              style={{
                border: '1.5px solid transparent',
                backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #E8F0FF 0%, #FFFFFF 100%)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                transform: hoveredCard === 'agents' ? 'scale(1.02) translateY(-2px)' : 'scale(1) translateY(0)',
              }}
            >
              {/* Hover Glow Effect */}
              {hoveredCard === 'agents' && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#D7E5FF] to-[#EDF3FF] opacity-25 blur-2xl -z-10"></div>
              )}

              {/* Icon with Enhanced Glassmorphism Background */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  {/* Enhanced Glassmorphism backdrop */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#EDF3FF]/40 to-[#E2EDFF]/25 backdrop-blur-xl rounded-[32px] transform scale-[1.35]"></div>
                  {/* Icon container */}
                  <div className="relative w-28 h-28 bg-gradient-to-br from-[#6BA3E8] to-[#8FC0FF] rounded-[28px] flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <Sparkles className="w-14 h-14 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-[22px] mb-2.5 text-gray-900 tracking-tight">
                AI Agents
              </h2>

              {/* Description */}
              <p className="text-[14px] text-gray-600 leading-relaxed px-1">
                <span className="text-gray-800">10-K filings</span>, <span className="text-gray-800">valuation models</span>, sentiment analysis, and <span className="text-gray-800">automated reporting</span>.
              </p>
            </button>

            {/* Finance News Card */}
            <button
              onClick={() => handleCardClick('finance-news')}
              onMouseEnter={() => setHoveredCard('news')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative bg-white/85 backdrop-blur-sm rounded-3xl p-10 shadow-md hover:shadow-xl transition-all duration-300 text-center"
              style={{
                border: '1.5px solid transparent',
                backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #E8F0FF 0%, #FFFFFF 100%)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                transform: hoveredCard === 'news' ? 'scale(1.02) translateY(-2px)' : 'scale(1) translateY(0)',
              }}
            >
              {/* Hover Glow Effect */}
              {hoveredCard === 'news' && (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#D7E5FF] to-[#EDF3FF] opacity-25 blur-2xl -z-10"></div>
              )}

              {/* Icon with Enhanced Glassmorphism Background */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  {/* Enhanced Glassmorphism backdrop */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#EDF3FF]/40 to-[#E2EDFF]/25 backdrop-blur-xl rounded-[32px] transform scale-[1.35]"></div>
                  {/* Icon container */}
                  <div className="relative w-28 h-28 bg-gradient-to-br from-[#6BA3E8] to-[#8FC0FF] rounded-[28px] flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <Newspaper className="w-14 h-14 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-[22px] mb-2.5 text-gray-900 tracking-tight">
                Finance News
              </h2>

              {/* Description */}
              <p className="text-[14px] text-gray-600 leading-relaxed px-1">
                Real-time <span className="text-gray-800">market updates</span>, <span className="text-gray-800">macro insights</span>, and breaking financial news coverage.
              </p>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 px-4">
            <div className="text-center py-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/30">
              <p className="text-[24px] text-gray-900 mb-0.5">12,000+</p>
              <p className="text-[12px] text-[#6B7F99]">10-K Filings Tracked</p>
            </div>
            <div className="text-center py-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/30">
              <p className="text-[24px] text-gray-900 mb-0.5">8</p>
              <p className="text-[12px] text-[#6B7F99]">Active AI Agents</p>
            </div>
            <div className="text-center py-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/30">
              <p className="text-[24px] text-gray-900 mb-0.5">5,200+</p>
              <p className="text-[12px] text-[#6B7F99]">US Equities Coverage</p>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center max-w-4xl mx-auto">
            <p className="text-[12px] text-[#6B7F99]/80">
              Powered by advanced AI technology for modern financial professionals
            </p>
          </div>
        </main>
      </AppShell>
    </div>
  );
}
