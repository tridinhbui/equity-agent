"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  DollarSign,
  Cpu,
  Network,
  BarChart3,
  Binary,
  Wallet,
  Zap,
  Activity,
  Database,
} from "lucide-react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  char: string;
}

export function FinanceTechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circuitCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  const stockTickers = [
    "AAPL $175.43 +2.5%",
    "GOOGL $142.18 +1.8%",
    "MSFT $378.91 -0.3%",
    "TSLA $242.84 +3.2%",
    "AMZN $151.94 +1.1%",
    "NVDA $495.22 +4.5%",
    "META $338.11 +2.3%",
    "BTC $43,521 +1.9%",
    "ETH $2,284 +2.7%",
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize data rain particles (hydration-safe)
  useEffect(() => {
    if (!mounted) return;
    const newParticles: Particle[] = [];
    const chars = ["0", "1", "$", "₿", "Ξ", "▲", "▼", "■", "●"];
    
    for (let i = 0; i < 60; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight - window.innerHeight,
        size: Math.random() * 12 + 8,
        speedX: 0,
        speedY: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        char: chars[Math.floor(Math.random() * chars.length)],
      });
    }
    particlesRef.current = newParticles;
  }, [mounted]);

  // Animate data rain particles
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.map((particle) => {
        let newY = particle.y + particle.speedY;

        // Reset to top when reaching bottom
        if (newY > canvas.height) {
          newY = -20;
          particle.x = Math.random() * canvas.width;
        }

        // Draw particle
        ctx.font = `${particle.size}px monospace`;
        ctx.fillStyle = `rgba(96, 165, 250, ${particle.opacity})`;
        ctx.fillText(particle.char, particle.x, newY);

        return { ...particle, y: newY };
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted]);

  // Draw neon circuit lines
  useEffect(() => {
    if (!mounted) return;
    const canvas = circuitCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drawCircuit = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Circuit pattern 1
      ctx.strokeStyle = "rgba(96, 165, 250, 0.3)";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(96, 165, 250, 0.8)";

      // Horizontal lines
      for (let i = 0; i < 5; i++) {
        const y = (canvas.height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        
        for (let x = 0; x < canvas.width; x += 60) {
          if (Math.random() > 0.3) {
            ctx.lineTo(x + 40, y);
            ctx.lineTo(x + 40, y + 20);
            ctx.lineTo(x + 60, y + 20);
          } else {
            ctx.lineTo(x + 60, y);
          }
        }
        ctx.stroke();
      }

      // Vertical lines
      for (let i = 0; i < 8; i++) {
        const x = (canvas.width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        
        for (let y = 0; y < canvas.height; y += 80) {
          if (Math.random() > 0.4) {
            ctx.lineTo(x, y + 50);
            ctx.lineTo(x + 15, y + 50);
            ctx.lineTo(x + 15, y + 80);
          } else {
            ctx.lineTo(x, y + 80);
          }
        }
        ctx.stroke();
      }

      // Connection nodes
      ctx.fillStyle = "rgba(96, 165, 250, 0.5)";
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawCircuit();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawCircuit();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="fixed inset-0 w-full h-full bg-gradient-to-br from-white via-blue-50 to-blue-100 overflow-hidden"
      style={{ zIndex: 0, pointerEvents: "none" }}
      onMouseMove={handleMouseMove}
    >
      {/* Emerald plasma core at center */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.2) 50%, transparent 100%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Spotlight gradients - 3 zones */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
          left: "15%",
          top: "20%",
        }}
        animate={{
          x: [-30, 30, -30],
          y: [-20, 20, -20],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, transparent 70%)",
          right: "10%",
          top: "30%",
        }}
        animate={{
          x: [20, -20, 20],
          y: [30, -30, 30],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-[550px] h-[550px] rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 70%)",
          left: "45%",
          bottom: "15%",
        }}
        animate={{
          x: [-25, 25, -25],
          y: [-15, 15, -15],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Neon circuit lines */}
      {mounted && (
        <canvas
          ref={circuitCanvasRef}
          className="absolute inset-0 opacity-30 pointer-events-none"
        />
      )}

      {/* Data raining particles */}
      {mounted && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
        />
      )}

      {/* Hologram mini UI - EPS Card */}
      {mounted && (
        <motion.div
          className="absolute left-[10%] top-[15%] w-40 h-32 border border-blue-500/40 bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: [0.6, 0.85, 0.6],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="text-blue-600/70 text-xs mb-1">EPS</div>
          <div className="text-blue-700 mb-2">$4.23</div>
          <svg className="w-full h-12" viewBox="0 0 100 40">
            <motion.polyline
              points="0,30 20,25 40,28 60,15 80,20 100,10"
              fill="none"
              stroke="rgba(59, 130, 246, 0.7)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>
        </motion.div>
      )}

      {/* Hologram mini UI - PE Card */}
      {mounted && (
        <motion.div
          className="absolute right-[5%] top-[8%] w-40 h-32 border border-cyan-500/40 bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: [0.6, 0.85, 0.6],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <div className="text-cyan-600/70 text-xs mb-1">P/E Ratio</div>
          <div className="text-cyan-700 mb-2">18.5x</div>
          <div className="flex items-end justify-between h-12">
            {[65, 45, 70, 55, 80, 60, 75].map((height, i) => (
              <motion.div
                key={i}
                className="w-2 bg-cyan-500/50 rounded-t"
                style={{ height: `${height}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Hologram mini UI - Chart Card */}
      {mounted && (
        <motion.div
          className="absolute left-[5%] bottom-[10%] w-48 h-36 border border-blue-500/40 bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: [0.6, 0.85, 0.6],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        >
          <div className="text-blue-600/70 text-xs mb-1">Market Cap</div>
          <div className="text-blue-700 mb-2">$2.8T</div>
          <svg className="w-full h-16" viewBox="0 0 120 50">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.0)" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 0 40 Q 15 35, 30 38 T 60 25 T 90 30 T 120 15"
              fill="url(#chartGradient)"
              stroke="rgba(59, 130, 246, 0.7)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>
        </motion.div>
      )}

      {/* Hologram mini UI - Volume Card */}
      {mounted && (
        <motion.div
          className="absolute right-[5%] bottom-[5%] w-44 h-32 border border-emerald-500/40 bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: [0.6, 0.85, 0.6],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        >
          <div className="text-emerald-600/70 text-xs mb-1">24h Volume</div>
          <div className="text-emerald-700 mb-2">$45.2B</div>
          <div className="flex items-end justify-between h-12 gap-1">
            {[40, 60, 45, 75, 55, 80, 50, 70, 60].map((height, i) => (
              <motion.div
                key={i}
                className="flex-1 bg-emerald-500/50 rounded-t"
                style={{ height: `${height}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                  repeat: Infinity,
                  repeatDelay: 4,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Stock ticker - top */}
      {mounted && (
        <div className="absolute top-8 left-0 w-full overflow-hidden opacity-5">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{
              x: [0, -1000],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...stockTickers, ...stockTickers, ...stockTickers].map((ticker, i) => (
              <span key={i} className="mx-8 text-blue-600">
                {ticker}
              </span>
            ))}
          </motion.div>
        </div>
      )}

      {/* Stock ticker - bottom */}
      {mounted && (
        <div className="absolute bottom-8 left-0 w-full overflow-hidden opacity-5">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{
              x: [-1000, 0],
            }}
            transition={{
              duration: 35,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...stockTickers, ...stockTickers, ...stockTickers].map((ticker, i) => (
              <span key={i} className="mx-8 text-cyan-600">
                {ticker}
              </span>
            ))}
          </motion.div>
        </div>
      )}

      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="rgb(96, 165, 250)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating tech icons with reduced opacity */}
      {mounted && (
        <div className="absolute inset-0">
          {[
            { Icon: Cpu, x: 25, y: 40, delay: 0 },
            { Icon: Network, x: 70, y: 50, delay: 1 },
            { Icon: Database, x: 50, y: 70, delay: 2 },
            { Icon: Zap, x: 80, y: 25, delay: 1.5 },
            { Icon: Binary, x: 35, y: 65, delay: 0.5 },
          ].map((item, i) => {
            const Icon = item.Icon;
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                }}
                animate={{
                  y: [-15, 15, -15],
                  rotate: [0, 360],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 12,
                  delay: item.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon className="w-10 h-10 text-blue-500" />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Mouse follower spotlight */}
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-blue-400/15 blur-3xl pointer-events-none"
        animate={{
          x: mousePos.x - 160,
          y: mousePos.y - 160,
        }}
        transition={{
          type: "spring",
          damping: 35,
          stiffness: 150,
        }}
      />
    </div>
  );
}
