import React from 'react';
import { calculateUpfrontCost, formatNaira, type Property } from '../../lib/scoring';

export function FeeCard({ property }: { property: Property }) {
  const cost = calculateUpfrontCost(property);
  if (cost.listingType === 'sale') {
    return (
      <section className="bg-white border border-stone-200 rounded-2xl p-4">
        <h2 className="font-bold text-lg">Asking price</h2>
        <p className="text-2xl font-black mt-2">{formatNaira(cost.rent)}</p>
        <p className="text-sm text-stone-600 mt-1">This listing is for sale, not rent.</p>
      </section>
    );
  }

  const rows = [
    { label: 'Annual rent', value: cost.rent },
    { label: 'Caution fee (10%)', value: cost.cautionFee },
    { label: 'Agency fee (10%)', value: cost.agencyFee },
    { label: 'Service charge (15%)', value: cost.serviceCharge },
  ];

  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-4">
      <h2 className="font-bold text-lg">What you pay upfront</h2>
      <p className="text-sm text-stone-600 mt-1">
        These amounts are calculated from the annual rent. Nothing is hidden.
      </p>
      <div className="mt-3 flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between">
            <span className="text-stone-600">{row.label}</span>
            <span className="font-semibold">{formatNaira(row.value)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 border-t border-stone-200 text-base">
          <span className="font-bold">Total to start</span>
          <span className="font-black text-emerald-800">{formatNaira(cost.total)}</span>
        </div>
      </div>
    </section>
  );
}
