import React from 'react';
import type { SwotReport } from '../../lib/neighborhood';

function Block({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'green' | 'amber' | 'sky' | 'rose';
}) {
  const cls = {
    green: 'bg-emerald-50 text-emerald-950',
    amber: 'bg-amber-50 text-amber-950',
    sky: 'bg-sky-50 text-sky-950',
    rose: 'bg-rose-50 text-rose-950',
  }[tone];
  return (
    <div className={`rounded-2xl p-3 ${cls}`}>
      <p className="font-bold text-sm mb-1">{title}</p>
      <ul className="list-disc pl-4 text-sm space-y-1">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function SwotCard({ swot }: { swot: SwotReport }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-bold text-lg">House SWOT</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <Block title="Strengths" items={swot.house.strengths} tone="green" />
          <Block title="Weaknesses" items={swot.house.weaknesses} tone="amber" />
          <Block title="Opportunities" items={swot.house.opportunities} tone="sky" />
          <Block title="Threats" items={swot.house.threats} tone="rose" />
        </div>
      </div>
      <div>
        <h2 className="font-bold text-lg">Neighbourhood SWOT</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <Block title="Strengths" items={swot.neighbourhood.strengths} tone="green" />
          <Block title="Weaknesses" items={swot.neighbourhood.weaknesses} tone="amber" />
          <Block title="Opportunities" items={swot.neighbourhood.opportunities} tone="sky" />
          <Block title="Threats" items={swot.neighbourhood.threats} tone="rose" />
        </div>
      </div>
    </section>
  );
}
