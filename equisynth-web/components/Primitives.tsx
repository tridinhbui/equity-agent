"use client";

export const SectionCard = (p:React.HTMLAttributes<HTMLDivElement>) =>
  <div {...p} className={`card ${p.className??''}`} />

export const PrimaryButton = (p:React.ButtonHTMLAttributes<HTMLButtonElement>) =>
  <button {...p} className={`btn btn-primary ${p.className??''}`} />

export const SecondaryButton = (p:React.ButtonHTMLAttributes<HTMLButtonElement>) =>
  <button {...p} className={`btn btn-secondary ${p.className??''}`} />

export const Input = (p:React.InputHTMLAttributes<HTMLInputElement>) =>
  <input {...p} className={`input ${p.className??''}`}/>

export const Select = (p:React.SelectHTMLAttributes<HTMLSelectElement>) =>
  <select {...p} className={`select ${p.className??''}`}/>

export const Textarea = (p:React.TextareaHTMLAttributes<HTMLTextAreaElement>) =>
  <textarea {...p} className={`textarea ${p.className??''}`}/>
