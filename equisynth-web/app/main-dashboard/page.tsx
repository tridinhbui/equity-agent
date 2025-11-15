"use client";

import { useState } from 'react';
import { Sparkles, Newspaper } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

export default function MainDashboard() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
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

  return (
    <AppShell showTabs={false}>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#F0F5FF] via-[#F5F9FF] to-[#FAFCFF]">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 left-16 w-72 h-72 bg-[#D7E5FF] rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-24 right-20 w-96 h-96 bg-[#E2EDFF] rounded-full opacity-15 blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#EDF3FF] rounded-full opacity-12 blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-[#E8F0FF] rounded-full opacity-15 blur-3xl"></div>
        </div>

        {/* Main Content */}
        <main className="relative z-10 container mx-auto px-6 py-20">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl mb-2 text-gray-950 tracking-tight">
              Welcome to EquiSynth
            </h1>
            <p className="text-gray-600/75">
              Choose your workspace to get started.
            </p>
          </div>

          {/* Selection Cards */}
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 px-4">
            {/* AI Agents Card */}
            <button
              onClick={() => handleCardClick('ai-agents')}
              onMouseEnter={() => setHoveredCard('agents')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-md hover:shadow-xl transition-all duration-300 text-center"
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

                  {/* Icon with Glassmorphism Background */}
                  <div className="mb-7 flex justify-center">
                    <div className="relative">
                      {/* Glassmorphism backdrop */}
                      <div className="absolute inset-0 bg-[#EDF3FF]/30 backdrop-blur-md rounded-3xl transform scale-125"></div>
                      {/* Icon container */}
                      <div className="relative w-24 h-24 bg-gradient-to-br from-[#6BA3E8] to-[#8FC0FF] rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Sparkles className="w-12 h-12 text-white" strokeWidth={2} />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-[22px] mb-3 text-gray-900 tracking-tight">
                AI Agents
              </h2>

              {/* Description */}
              <p className="text-[15px] text-gray-600 leading-relaxed px-2">
                Access powerful agents for data extraction, valuation, sentiment analysis, reporting, and more.
              </p>
            </button>

            {/* Finance News Card */}
            <button
              onClick={() => handleCardClick('finance-news')}
              onMouseEnter={() => setHoveredCard('news')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-md hover:shadow-xl transition-all duration-300 text-center"
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

                  {/* Icon with Glassmorphism Background */}
                  <div className="mb-7 flex justify-center">
                    <div className="relative">
                      {/* Glassmorphism backdrop */}
                      <div className="absolute inset-0 bg-[#EDF3FF]/30 backdrop-blur-md rounded-3xl transform scale-125"></div>
                      {/* Icon container */}
                      <div className="relative w-24 h-24 bg-gradient-to-br from-[#6BA3E8] to-[#8FC0FF] rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Newspaper className="w-12 h-12 text-white" strokeWidth={2} />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-[22px] mb-3 text-gray-900 tracking-tight">
                Finance News
              </h2>

              {/* Description */}
              <p className="text-[15px] text-gray-600 leading-relaxed px-2">
                Browse real-time financial news, market updates, and macro insights.
              </p>
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-14 text-center max-w-4xl mx-auto">
            <p className="text-[13px] text-[#6B7F99]">
              Powered by advanced AI technology for modern financial professionals
            </p>
          </div>
        </main>
      </div>
    </AppShell>
  );
}

