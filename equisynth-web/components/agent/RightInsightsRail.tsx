"use client";
import WeeklyFilingsCard from "./WeeklyFilingsCard";

export default function RightInsightsRail({ filingsPerDay }: { filingsPerDay?: number[] }) {
  return (
    <aside className="hidden md:block">
      <div className="sticky top-20">
        <WeeklyFilingsCard data={filingsPerDay} />
      </div>
    </aside>
  );
}
