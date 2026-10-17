import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { WalkthroughFrame } from '../../lib/walkthrough';

export function Walkthrough({ frames }: { frames: WalkthroughFrame[] }) {
  const [index, setIndex] = useState(0);
  if (!frames.length) {
    return <p className="text-sm text-stone-500">No photos yet for this walkthrough.</p>;
  }
  const frame = frames[index];

  return (
    <div className="bg-stone-900 rounded-3xl overflow-hidden">
      <div className="relative aspect-[4/3] bg-stone-800">
        <AnimatePresence mode="wait">
          <motion.img
            key={frame.image + index}
            src={frame.image}
            alt={frame.label}
            initial={{ opacity: 0, scale: 1.04, x: 24 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
          <p className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">
            Virtual walkthrough
          </p>
          <p className="font-bold text-lg">{frame.label}</p>
          <p className="text-sm text-stone-200">{frame.narration}</p>
        </div>
      </div>
      <div className="p-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold disabled:opacity-40"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Step back
        </button>
        <p className="text-stone-300 text-xs">
          {index + 1} / {frames.length}
        </p>
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40"
          disabled={index === frames.length - 1}
          onClick={() => setIndex((i) => Math.min(frames.length - 1, i + 1))}
        >
          Walk forward
        </button>
      </div>
    </div>
  );
}
