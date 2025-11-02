"use client";

export default function StepHeader({ steps, active }:{steps:string[]; active:number}) {
  return (
    <ol className="flex items-center gap-4 text-sm">
      {steps.map((s,i)=>(
        <li key={s} className="flex items-center gap-2">
          <span className={`h-6 w-6 grid place-items-center rounded-full border ${i<=active?"bg-blue-600 text-white border-transparent":"border-gray-300 text-gray-500"}`}>{i+1}</span>
          <span className={i<=active?"font-medium":"text-gray-500"}>{s}</span>
          {i<steps.length-1 && <span className="w-8 h-px bg-gray-200" />}
        </li>
      ))}
    </ol>
  );
}
