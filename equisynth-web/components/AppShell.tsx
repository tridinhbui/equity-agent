"use client";

import React from "react";
import AgentTabs from "./AgentTabs";

type AppShellProps = {
  children: React.ReactNode;
  /** show the agent tabs bar under the header */
  showTabs?: boolean;
  /** show right-side header actions (search/avatar) */
  showHeaderActions?: boolean;
};

export default function AppShell({
  children,
  showTabs = true,
  showHeaderActions = true,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="stack">
            <strong>EquiSynth</strong>
          </div>

          {showHeaderActions && (
            <div className="stack">
              <input
                className="input"
                placeholder="Search… ( / )"
                style={{ width: 260 }}
              />
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--brand-50)",
                }}
              />
            </div>
          )}
        </div>
      </header>

      {/* Tabs slot — render only when enabled */}
      {showTabs && (
        <div className="container" style={{ paddingTop: 12, paddingBottom: 0 }}>
          <AgentTabs />
        </div>
      )}

      <main className="main">
        <div className="container">{children}</div>
      </main>

      <footer className="app-header">
        <div className="app-header__inner muted" style={{ height: 48 }}>
          © {new Date().getFullYear()} EquiSynth
        </div>
      </footer>
    </div>
  );
}
