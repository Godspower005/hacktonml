import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function Layout({
  children,
  eyebrow,
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Home className="w-5 h-5" />
            </span>
            <span className="font-bold text-sm leading-tight truncate">
              Your House Hunting Pal
            </span>
          </Link>
          {eyebrow ? (
            <span className="text-[11px] text-stone-500 font-medium text-right">{eyebrow}</span>
          ) : null}
        </div>
      </header>
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6">{children}</main>
      <footer className="text-center text-[11px] text-stone-500 py-5 px-4">
        Built for people looking for a home in Nigeria. Prices are in Naira (₦).
      </footer>
    </div>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ''}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-stone-800">{label}</span>
      {children}
      {hint ? <span className="text-xs text-stone-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-base text-stone-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100';
