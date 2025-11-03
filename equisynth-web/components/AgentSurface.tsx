"use client";
import React from "react";
import clsx from "clsx";

type AgentSurfaceProps = {
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  padding?: string; // tailwind padding override (e.g. "p-6 md:p-10")
  children?: React.ReactNode;
};

export default function AgentSurface({
  className,
  title,
  subtitle,
  padding = "p-6 md:p-10",
  children,
}: AgentSurfaceProps) {
  return (
    <section className={clsx("agent-hero", padding, className)}>
      {(title || subtitle) && (
        <header className="mb-6">
          {typeof title === "string" ? (
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              {title}
            </h1>
          ) : (
            title
          )}
          {subtitle && (
            <p className="mt-2 text-gray-600">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
