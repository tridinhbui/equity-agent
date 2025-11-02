"use client";

export default function Hero({
  title,
  subtitle,
  badges,
}: {
  title: string;
  subtitle?: string;
  badges?: string[];
}) {
  return (
    <div className="relative">
      {/* subtle brand halo behind hero */}
      <div className="login-halo" />
      <div className="mx-auto max-w-2xl">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-gray-600">{subtitle}</p>
          )}

          {badges && badges.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {badges.map((b, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs border border-gray-200 bg-white text-gray-600"
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
