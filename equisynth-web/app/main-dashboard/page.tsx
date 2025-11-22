"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Newspaper, Settings, Bell, TrendingUp, BarChart3, Zap, Clock, FileText, PieChart, Database, ArrowUpRight, CheckCircle2, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

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
    <svg width={width} height={height} className="w-full h-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function MainDashboard() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [tickerPosition, setTickerPosition] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cardTilt, setCardTilt] = useState({ agents: { x: 0, y: 0 }, news: { x: 0, y: 0 } });
  const [particles, setParticles] = useState<Array<{ x: number; y: number; delay: number; size: number }>>([]);
  const [blobs, setBlobs] = useState<Array<{ x: number; y: number; size: number; duration: number }>>([]);
  const [statsVisible, setStatsVisible] = useState(false);
  const [counts, setCounts] = useState({ filings: 0, agents: 0, equities: 0 });
  const [time, setTime] = useState(new Date());
  const router = useRouter();

  const handleCardClick = (destination: string) => {
    if (destination === 'ai-agents') {
      router.push('/dashboard');
    } else if (destination === 'finance-news') {
      router.push('/finance-news');
    }
  };

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      size: Math.random() * 2 + 1
    }));
    setParticles(newParticles);

    const newBlobs = Array.from({ length: 5 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 300 + 200,
      duration: Math.random() * 3 + 5
    }));
    setBlobs(newBlobs);
  }, []);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Market ticker animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPosition((prev) => (prev <= -50 ? 0 : prev - 0.08));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Card tilt effect
  const handleCardMouseMove = (e: React.MouseEvent<HTMLButtonElement>, card: 'agents' | 'news') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 25;
    const y = (e.clientY - rect.top - rect.height / 2) / 25;
    setCardTilt(prev => ({ ...prev, [card]: { x, y } }));
  };

  const handleCardMouseLeave = (card: 'agents' | 'news') => {
    setCardTilt(prev => ({ ...prev, [card]: { x: 0, y: 0 } }));
  };

  // Stats count-up animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !statsVisible) {
          setStatsVisible(true);
          
          let filingsCount = 0;
          const filingsInterval = setInterval(() => {
            filingsCount += 200;
            if (filingsCount >= 12000) {
              setCounts(prev => ({ ...prev, filings: 12000 }));
              clearInterval(filingsInterval);
            } else {
              setCounts(prev => ({ ...prev, filings: filingsCount }));
            }
          }, 20);

          let agentsCount = 0;
          const agentsInterval = setInterval(() => {
            agentsCount += 1;
            if (agentsCount >= 8) {
              setCounts(prev => ({ ...prev, agents: 8 }));
              clearInterval(agentsInterval);
            } else {
              setCounts(prev => ({ ...prev, agents: agentsCount }));
            }
          }, 100);

          let equitiesCount = 0;
          const equitiesInterval = setInterval(() => {
            equitiesCount += 100;
            if (equitiesCount >= 5200) {
              setCounts(prev => ({ ...prev, equities: 5200 }));
              clearInterval(equitiesInterval);
            } else {
              setCounts(prev => ({ ...prev, equities: equitiesCount }));
            }
          }, 20);
        }
      },
      { threshold: 0.5 }
    );

    const statsElement = document.getElementById('stats-section');
    if (statsElement) observer.observe(statsElement);

    return () => observer.disconnect();
  }, [statsVisible]);

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
    { id: 1, title: 'NVDA Q3 valuation generated', time: '30s ago', icon: BarChart3, color: 'text-green-600' },
    { id: 2, title: '10-K extraction completed for AAPL', time: '2m ago', icon: FileText, color: 'text-blue-600' },
    { id: 3, title: 'New macro insights report available', time: '5m ago', icon: TrendingUp, color: 'text-purple-600' },
    { id: 4, title: 'Sentiment analysis: Tech sector bullish', time: '12m ago', icon: Activity, color: 'text-cyan-600' }
  ];

  const exploreTools = [
    { id: 1, title: 'Financial Models', desc: 'DCF, Comps, LBO', icon: PieChart, gradient: 'from-[#4A90E2] to-[#7BB3FF]' },
    { id: 2, title: 'Industry Benchmarks', desc: 'Peer analysis', icon: BarChart3, gradient: 'from-[#6B8DD6] to-[#8FA8E0]' },
    { id: 3, title: 'Automated Reports', desc: 'Custom exports', icon: FileText, gradient: 'from-[#5C9DE5] to-[#7DB4F0]' },
    { id: 4, title: 'SEC Filings Parser', desc: 'Real-time data', icon: Database, gradient: 'from-[#4E95E0] to-[#72ACEC]' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#E7F1FF] via-[#F8FAFF] to-[#DCEAFB]">
      {/* Grain Texture Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.045] z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      ></div>

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.01] z-[1]">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `
              linear-gradient(to right, #4A90E2 1px, transparent 1px),
              linear-gradient(to bottom, #4A90E2 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>

      {/* Animated Ambient Blobs */}
      {blobs.map((blob, idx) => (
        <div
          key={idx}
          className="absolute rounded-full blur-3xl opacity-20 animate-blob"
          style={{
            left: `${blob.x}%`,
            top: `${blob.y}%`,
            width: `${blob.size}px`,
            height: `${blob.size}px`,
            background: idx % 2 === 0 
              ? 'linear-gradient(135deg, #C7DBFF 0%, #E7D5FF 100%)'
              : 'linear-gradient(135deg, #D6E9FF 0%, #E0E7FF 100%)',
            animationDuration: `${blob.duration}s`,
            animationDelay: `${idx * 0.5}s`
          }}
        ></div>
      ))}

      {/* Floating Particles */}
      {particles.map((particle, idx) => (
        <div
          key={idx}
          className="absolute rounded-full bg-[#7DA4FF] animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: 0.08 + Math.random() * 0.02,
            animationDelay: `${particle.delay}s`,
            animationDuration: '10s'
          }}
        ></div>
      ))}

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div 
          className="absolute top-40 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-[#C7DBFF]/30 to-[#E7F1FF]/20 rounded-full blur-3xl transition-transform duration-[3000ms] ease-out"
          style={{ transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)` }}
        ></div>
        <div 
          className="absolute bottom-32 right-10 w-[600px] h-[600px] bg-gradient-to-tl from-[#D6E9FF]/30 to-[#DCEAFB]/20 rounded-full blur-3xl transition-transform duration-[3000ms] ease-out"
          style={{ transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)` }}
        ></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-20 px-8 py-5 flex items-center justify-between border-b border-white/50 bg-white/25 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#4A90E2] to-[#7BB3FF] rounded-xl flex items-center justify-center shadow-lg animate-icon-pulse">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl tracking-tight text-gray-950">EquiSynth</span>
            <div className="text-[10px] text-gray-500 tracking-wide uppercase">Intelligence Platform</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-right mr-4">
            <div className="text-xs text-gray-500">{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <div className="text-[11px] text-gray-400">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <button className="p-3 hover:bg-white/50 rounded-xl transition-all duration-200 relative group">
            <Bell className="w-5 h-5 text-gray-600 group-hover:text-[#4A90E2] transition-colors" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-gradient-to-br from-[#4A90E2] to-[#7BB3FF] rounded-full animate-pulse"></span>
          </button>
          <button className="p-3 hover:bg-white/50 rounded-xl transition-all duration-200 group">
            <Settings className="w-5 h-5 text-gray-600 group-hover:text-[#4A90E2] transition-colors" />
          </button>
          <button className="p-2.5 hover:bg-white/50 rounded-xl transition-all duration-200 ml-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-[#4A90E2] to-[#7BB3FF] rounded-xl flex items-center justify-center text-white text-xs group-hover:shadow-lg transition-all">
              JD
            </div>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-8 relative">
          <div className="inline-block relative mb-4">
            {/* Enhanced Animated Halo */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#E7F1FF] via-[#D6E9FF] to-[#E7F1FF] opacity-50 blur-3xl animate-glow-strong"></div>
            <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-[#7DA4FF]/20 to-transparent blur-2xl animate-glow-strong" style={{ animationDelay: '1s' }}></div>
            
            <h1 className="text-[40px] text-gray-950 relative z-10 mb-2" style={{ letterSpacing: '-0.02em' }}>
              Welcome to EquiSynth
            </h1>
            
            {/* Animated underline accent */}
            <div className="h-0.5 bg-gradient-to-r from-transparent via-[#7DA4FF]/40 to-transparent w-full animate-expand"></div>
          </div>
          
          <p className="text-[15px] text-[#6B7F99] opacity-70 mb-6" style={{ letterSpacing: '0.01em' }}>
            Your intelligent workspace for modern finance.
          </p>

          {/* Personalized Workspace Card */}
          <div className="inline-block relative animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E7F1FF]/40 to-[#D6E9FF]/40 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl px-6 py-3 shadow-[0_8px_32px_rgba(74,144,226,0.08)]">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-gray-600">8 Agents Active</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs text-gray-600">142 Analyses Today</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs text-gray-600">Last sync: 2m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Ticker Strip with Sparklines */}
        <div className="max-w-5xl mx-auto mb-12">
          {/* Ticker Bar */}
          <div className="relative mb-4 animate-float-slow">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E7F1FF]/30 via-white/40 to-[#D6E9FF]/30 rounded-3xl blur-xl"></div>
            <div className="relative overflow-hidden bg-white/45 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_20px_60px_rgba(74,144,226,0.08)]">
              <div className="py-4 px-6 overflow-hidden">
                <div 
                  className="flex items-center space-x-10 whitespace-nowrap"
                  style={{ transform: `translateX(${tickerPosition}%)` }}
                >
                  {[...marketData, ...marketData].map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center space-x-2.5 text-[15px] group cursor-pointer transition-all duration-300 hover:scale-105"
                    >
                      <span className="text-gray-800">{item.symbol}</span>
                      <span className={`transition-all duration-300 ${
                        item.positive 
                          ? 'text-green-600 group-hover:text-green-700' 
                          : 'text-red-600 group-hover:text-red-700'
                      }`}>
                        {item.change}
                      </span>
                      {idx < marketData.length * 2 - 1 && (
                        <span className="text-gray-300 ml-8">•</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mini Sparklines */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'S&P 500', value: '+0.42%', data: sparklineData.sp500, color: '#10b981' },
              { label: 'VIX', value: '+2.15%', data: sparklineData.vix, color: '#f59e0b' },
              { label: 'NVDA', value: '+3.21%', data: sparklineData.nvda, color: '#3b82f6' }
            ].map((item, idx) => (
              <div key={idx} className="group relative bg-white/30 backdrop-blur-xl border border-white/50 rounded-2xl p-3 hover:bg-white/40 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">{item.label}</span>
                  <span className="text-xs text-green-600">{item.value}</span>
                </div>
                <div className="h-8">
                  <Sparkline data={item.data} color={item.color} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selection Cards */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 px-4 mb-16">
          {/* AI Agents Card */}
          <button
            onClick={() => handleCardClick('ai-agents')}
            onMouseEnter={() => setHoveredCard('agents')}
            onMouseLeave={() => {
              setHoveredCard(null);
              handleCardMouseLeave('agents');
            }}
            onMouseMove={(e) => handleCardMouseMove(e, 'agents')}
            className="group relative bg-gradient-to-br from-white/85 to-white/65 backdrop-blur-2xl rounded-[32px] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_30px_80px_rgba(74,144,226,0.18)] transition-all duration-500 ease-out text-center border border-white/70"
            style={{
              transform: hoveredCard === 'agents' 
                ? `scale(1.03) translateY(-8px) perspective(1000px) rotateX(${cardTilt.agents.y}deg) rotateY(${cardTilt.agents.x}deg)` 
                : 'scale(1) translateY(0) perspective(1000px) rotateX(0deg) rotateY(0deg)',
            }}
          >
            {/* Micro-illustration background */}
            <div className="absolute inset-0 opacity-5 overflow-hidden rounded-[32px]">
              <div className="absolute top-10 right-10 w-32 h-32 border-2 border-[#4A90E2] rounded-lg rotate-12"></div>
              <div className="absolute bottom-10 left-10 w-24 h-24 border border-[#7DA4FF] rounded-full"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-[#4A90E2] rounded-lg -rotate-6"></div>
            </div>

            {/* Hover Glow Effect */}
            {hoveredCard === 'agents' && (
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#C7DBFF]/60 via-[#E7F1FF]/50 to-[#D6E9FF]/60 opacity-60 blur-3xl -z-10 animate-pulse-slow"></div>
            )}

            {/* Inner gradient background */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#E7F1FF]/15 via-transparent to-[#D6E9FF]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Icon with Enhanced Effects */}
            <div className="mb-8 flex justify-center relative">
              <div className="relative">
                {/* Glassmorphism backdrop */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#E7F1FF]/70 to-[#D6E9FF]/50 backdrop-blur-2xl rounded-[36px] transform scale-[1.4]"></div>
                
                {/* Animated shimmer ring */}
                <div className="absolute inset-0 rounded-[32px] animate-spin-slow opacity-50" style={{ 
                  background: 'linear-gradient(135deg, transparent 40%, rgba(125, 164, 255, 0.4) 50%, transparent 60%)',
                  transform: 'scale(1.2)',
                  animationDuration: '4s'
                }}></div>

                {/* Pulsing glow */}
                <div className="absolute inset-0 rounded-[32px] bg-[#7DA4FF]/30 blur-xl animate-pulse-slow"></div>
                
                {/* Icon container */}
                <div className="relative w-32 h-32 bg-gradient-to-br from-[#4A90E2] to-[#7BB3FF] rounded-[32px] flex items-center justify-center shadow-[0_20px_60px_rgba(74,144,226,0.4),inset_0_2px_6px_rgba(255,255,255,0.3),inset_0_-4px_8px_rgba(0,0,0,0.15)] group-hover:scale-110 group-hover:shadow-[0_30px_80px_rgba(74,144,226,0.5)] transition-all duration-500 animate-icon-pulse">
                  <Sparkles className="w-16 h-16 text-white" strokeWidth={2.5} />
                  
                  {/* Inner highlight glow */}
                  <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[26px] mb-3 text-gray-950 tracking-tight group-hover:text-[#4A90E2] transition-colors duration-300">
              AI Agents
            </h2>

            {/* Description */}
            <p className="text-[15px] text-gray-600 leading-relaxed px-2 mb-6">
              <span className="text-gray-800">10-K filings</span>, <span className="text-gray-800">valuation models</span>, sentiment analysis, and <span className="text-gray-800">automated reporting</span>.
            </p>
            
            {/* Feature tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['Data Extraction', 'Valuation', 'Analysis'].map((tag, idx) => (
                <span 
                  key={idx}
                  className="px-4 py-2 bg-white/70 backdrop-blur-md text-[#4A90E2] rounded-full text-[12px] border border-[#D6E9FF]/60 hover:bg-white/90 hover:border-[#7DA4FF]/80 hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer" 
                  style={{ fontWeight: 500 }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* Finance News Card */}
          <button
            onClick={() => handleCardClick('finance-news')}
            onMouseEnter={() => setHoveredCard('news')}
            onMouseLeave={() => {
              setHoveredCard(null);
              handleCardMouseLeave('news');
            }}
            onMouseMove={(e) => handleCardMouseMove(e, 'news')}
            className="group relative bg-gradient-to-br from-white/85 to-white/65 backdrop-blur-2xl rounded-[32px] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_30px_80px_rgba(74,144,226,0.18)] transition-all duration-500 ease-out text-center border border-white/70"
            style={{
              transform: hoveredCard === 'news' 
                ? `scale(1.03) translateY(-8px) perspective(1000px) rotateX(${cardTilt.news.y}deg) rotateY(${cardTilt.news.x}deg)` 
                : 'scale(1) translateY(0) perspective(1000px) rotateX(0deg) rotateY(0deg)',
            }}
          >
            {/* Micro-illustration background */}
            <div className="absolute inset-0 opacity-5 overflow-hidden rounded-[32px]">
              <div className="absolute top-8 left-8 w-20 h-1 bg-[#4A90E2]"></div>
              <div className="absolute top-12 left-8 w-16 h-1 bg-[#7DA4FF]"></div>
              <div className="absolute top-16 left-8 w-12 h-1 bg-[#4A90E2]"></div>
              <div className="absolute bottom-10 right-10 w-28 h-28 border-2 border-[#7DA4FF] rounded-lg rotate-12"></div>
            </div>

            {/* Hover Glow Effect */}
            {hoveredCard === 'news' && (
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#C7DBFF]/60 via-[#E7F1FF]/50 to-[#D6E9FF]/60 opacity-60 blur-3xl -z-10 animate-pulse-slow"></div>
            )}

            {/* Inner gradient background */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#E7F1FF]/15 via-transparent to-[#D6E9FF]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Icon with Enhanced Effects */}
            <div className="mb-8 flex justify-center relative">
              <div className="relative">
                {/* Glassmorphism backdrop */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#E7F1FF]/70 to-[#D6E9FF]/50 backdrop-blur-2xl rounded-[36px] transform scale-[1.4]"></div>
                
                {/* Animated shimmer ring */}
                <div className="absolute inset-0 rounded-[32px] animate-spin-slow opacity-50" style={{ 
                  background: 'linear-gradient(135deg, transparent 40%, rgba(125, 164, 255, 0.4) 50%, transparent 60%)',
                  transform: 'scale(1.2)',
                  animationDuration: '4s',
                  animationDelay: '0.5s'
                }}></div>

                {/* Pulsing glow */}
                <div className="absolute inset-0 rounded-[32px] bg-[#7DA4FF]/30 blur-xl animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
                
                {/* Icon container */}
                <div className="relative w-32 h-32 bg-gradient-to-br from-[#4A90E2] to-[#7BB3FF] rounded-[32px] flex items-center justify-center shadow-[0_20px_60px_rgba(74,144,226,0.4),inset_0_2px_6px_rgba(255,255,255,0.3),inset_0_-4px_8px_rgba(0,0,0,0.15)] group-hover:scale-110 group-hover:shadow-[0_30px_80px_rgba(74,144,226,0.5)] transition-all duration-500 animate-icon-pulse">
                  <Newspaper className="w-16 h-16 text-white" strokeWidth={2.5} />
                  
                  {/* Inner highlight glow */}
                  <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[26px] mb-3 text-gray-950 tracking-tight group-hover:text-[#4A90E2] transition-colors duration-300">
              Finance News
            </h2>

            {/* Description */}
            <p className="text-[15px] text-gray-600 leading-relaxed px-2 mb-6">
              Real-time <span className="text-gray-800">market updates</span>, <span className="text-gray-800">macro insights</span>, and breaking financial news coverage.
            </p>
            
            {/* Feature tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['Real-time', 'Markets', 'Insights'].map((tag, idx) => (
                <span 
                  key={idx}
                  className="px-4 py-2 bg-white/70 backdrop-blur-md text-[#4A90E2] rounded-full text-[12px] border border-[#D6E9FF]/60 hover:bg-white/90 hover:border-[#7DA4FF]/80 hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer" 
                  style={{ fontWeight: 500 }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </div>

        {/* Quick Stats Module */}
        <div id="stats-section" className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-8">
            <h3 className="text-[20px] text-gray-900 mb-2">Platform Overview</h3>
            <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-[#7DA4FF]/50 to-transparent mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 px-4">
            {/* Stat 1 */}
            <div className="group relative text-center py-8 bg-gradient-to-br from-white/65 to-white/45 backdrop-blur-2xl rounded-[28px] border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.7)] hover:shadow-[0_30px_80px_rgba(74,144,226,0.15)] hover:scale-105 transition-all duration-500 overflow-hidden">
              {/* Top accent glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-1 bg-gradient-to-r from-transparent via-[#7DA4FF]/70 to-transparent rounded-full"></div>
              
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#E7F1FF]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="mb-3 flex justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4A90E2]/20 to-[#7DA4FF]/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <TrendingUp className="w-7 h-7 text-[#4A90E2] animate-icon-pulse" strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-[34px] text-gray-950 mb-1 group-hover:text-[#4A90E2] transition-colors duration-300">
                  {counts.filings.toLocaleString()}+
                </p>
                <p className="text-[13px] text-[#6B7F99] px-4">10-K Filings Tracked</p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="group relative text-center py-8 bg-gradient-to-br from-white/65 to-white/45 backdrop-blur-2xl rounded-[28px] border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.7)] hover:shadow-[0_30px_80px_rgba(74,144,226,0.15)] hover:scale-105 transition-all duration-500 overflow-hidden">
              {/* Top accent glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-1 bg-gradient-to-r from-transparent via-[#7DA4FF]/70 to-transparent rounded-full"></div>
              
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#E7F1FF]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="mb-3 flex justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4A90E2]/20 to-[#7DA4FF]/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <Zap className="w-7 h-7 text-[#4A90E2] animate-icon-pulse" strokeWidth={2.5} style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>
                <p className="text-[34px] text-gray-950 mb-1 group-hover:text-[#4A90E2] transition-colors duration-300">
                  {counts.agents}
                </p>
                <p className="text-[13px] text-[#6B7F99] px-4">Active AI Agents</p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="group relative text-center py-8 bg-gradient-to-br from-white/65 to-white/45 backdrop-blur-2xl rounded-[28px] border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.7)] hover:shadow-[0_30px_80px_rgba(74,144,226,0.15)] hover:scale-105 transition-all duration-500 overflow-hidden">
              {/* Top accent glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-1 bg-gradient-to-r from-transparent via-[#7DA4FF]/70 to-transparent rounded-full"></div>
              
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#E7F1FF]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="mb-3 flex justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4A90E2]/20 to-[#7DA4FF]/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <BarChart3 className="w-7 h-7 text-[#4A90E2] animate-icon-pulse" strokeWidth={2.5} style={{ animationDelay: '1s' }} />
                  </div>
                </div>
                <p className="text-[34px] text-gray-950 mb-1 group-hover:text-[#4A90E2] transition-colors duration-300">
                  {counts.equities.toLocaleString()}+
                </p>
                <p className="text-[13px] text-[#6B7F99] px-4">US Equities Coverage</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="max-w-5xl mx-auto mb-20 px-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-[20px] text-gray-900 mb-2">Recent Activity</h3>
              <div className="h-0.5 w-16 bg-gradient-to-r from-[#7DA4FF]/50 to-transparent"></div>
            </div>
            <button className="text-xs text-[#4A90E2] hover:text-[#7BB3FF] transition-colors flex items-center space-x-1">
              <span>View all</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {recentActivity.map((activity, idx) => (
              <div 
                key={activity.id}
                className="group relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 hover:bg-white/55 hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                    activity.color === 'text-green-600' ? 'from-green-50 to-green-100' :
                    activity.color === 'text-blue-600' ? 'from-blue-50 to-blue-100' :
                    activity.color === 'text-purple-600' ? 'from-purple-50 to-purple-100' :
                    'from-cyan-50 to-cyan-100'
                  } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 mb-1 line-clamp-1">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explore More Tools Section */}
        <div className="max-w-5xl mx-auto mb-16 px-4">
          <div className="text-center mb-8">
            <h3 className="text-[20px] text-gray-900 mb-2">Explore More Tools</h3>
            <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-[#7DA4FF]/50 to-transparent mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {exploreTools.map((tool, idx) => (
              <button
                key={tool.id}
                className="group relative bg-white/35 backdrop-blur-xl border border-white/60 rounded-2xl p-6 hover:bg-white/50 hover:shadow-[0_20px_50px_rgba(74,144,226,0.12)] hover:scale-105 transition-all duration-300 text-center animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E7F1FF]/30 to-[#D6E9FF]/30 opacity-0 group-hover:opacity-100 blur-xl -z-10 transition-opacity duration-300"></div>
                
                <div className="mb-4 flex justify-center">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    <tool.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h4 className="text-[14px] text-gray-900 mb-1.5 group-hover:text-[#4A90E2] transition-colors">{tool.title}</h4>
                <p className="text-[11px] text-gray-500">{tool.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center max-w-5xl mx-auto">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E7F1FF]/20 to-[#D6E9FF]/20 rounded-xl blur-xl"></div>
            <div className="relative bg-white/25 backdrop-blur-xl border border-white/40 rounded-xl px-8 py-4">
              <p className="text-[13px] text-[#6B7F99]/80" style={{ letterSpacing: '0.02em' }}>
                Powered by <span className="text-gray-800">EquiSynth Intelligence</span> · SEC-compliant · 2025
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
