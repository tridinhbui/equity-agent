"use client";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { FileText, TrendingUp, Brain, Calculator, Shield, Database, Lock } from "lucide-react";
import { signIn } from "next-auth/react";

export function LoginCard() {
  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/main-dashboard" });
  };

  return (
    <Card className="w-full max-w-2xl bg-white shadow-2xl border-0 overflow-hidden">
      {/* Main Content */}
      <div className="p-12">
        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-slate-900 mb-4 tracking-tight text-3xl font-bold">
            AI-Powered Equity Research
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Institutional-grade financial analysis combining SEC filings, real-time market data, and proprietary ML models.
          </p>
        </div>

        {/* Key Functions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 max-w-xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-slate-900">
                Read <span className="text-blue-600">filings</span> & transcripts
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-slate-900">
                <span className="text-emerald-600">Real-time</span> market & fundamentals data
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <div className="text-slate-900">
                <span className="text-violet-600">Sentiment</span> analysis (FinBERT & embeddings)
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-slate-900">
                Automated <span className="text-amber-600">valuation</span> models (DCF, multiples)
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mb-10 flex justify-center">
          <Button
            onClick={handleSignIn}
            className="w-full max-w-md h-12 bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-8 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-slate-700" />
            </div>
            <span className="text-sm">OAuth 2.0</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <Database className="w-4 h-4 text-slate-700" />
            </div>
            <span className="text-sm">SEC-First Data</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
              <Lock className="w-4 h-4 text-slate-700" />
            </div>
            <span className="text-sm">User-Owned Data</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

