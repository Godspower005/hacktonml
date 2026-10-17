import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { loadSeeker } from '../../state/session';
import { formatNaira, type PropertyScoreResult } from '../../../lib/scoring';
import { IbadanMap } from '../../components/IbadanMap';
import { safeFetchJson } from '../../utils/api';

export default function Matches() {
  const navigate = useNavigate();
  const profile = loadSeeker();
  const [results, setResults] = useState<(PropertyScoreResult & { fitSource?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.fullName) {
      navigate('/seeker');
      return;
    }
    setLoading(true);
    safeFetchJson('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    })
      .then((d) => {
        if (!d.success) throw new Error(d.error || 'Match failed');
        setResults(d.data);
        if (d.data[0]) setSelectedId(d.data[0].property.id);
      })
      .catch((err) => setError(err.message || 'Could not rank homes'))
      .finally(() => setLoading(false));
  }, []);

  const selected = results.find((r) => r.property.id === selectedId)?.property || null;

  return (
    <Layout eyebrow="Your matches">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-black">Homes ranked for you</h1>
          <p className="text-stone-600 mt-2 text-sm">
            Hello {profile.fullName?.split(' ')[0] || 'there'}. We compared listings with your
            area, budget
            {profile.maxBudget ? ` of ${formatNaira(profile.maxBudget)}` : ''}, and daily route.
          </p>
        </div>

        {loading ? <p className="text-stone-500">Matching homes…</p> : null}
        {error ? <p className="text-red-700 text-sm">{error}</p> : null}

        {!loading && results.length > 0 ? (
          <div className="h-[240px] rounded-2xl overflow-hidden border border-stone-200">
            <IbadanMap
              properties={results.map((r) => r.property)}
              scoredProperties={results}
              selectedProperty={selected}
              onSelectProperty={(p) => setSelectedId(p.id)}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {results.map((item, index) => (
            <Link
              key={item.property.id}
              to={`/listing/${item.property.id}`}
              className={`bg-white rounded-2xl border p-4 ${
                selectedId === item.property.id ? 'border-emerald-600' : 'border-stone-200'
              }`}
            >
              <div className="flex justify-between gap-3 items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                    #{index + 1} · {item.overallScore}% match
                  </p>
                  <h2 className="font-bold text-stone-900 mt-1">{item.property.title}</h2>
                  <p className="text-sm text-stone-600">{item.property.neighborhood}</p>
                </div>
                <p className="text-sm font-bold text-stone-900 whitespace-nowrap">
                  {formatNaira(item.property.price_ngn)}
                  <span className="block text-[11px] font-medium text-stone-500 text-right">
                    {item.property.listing_type === 'sale' ? 'sale' : '/ year'}
                  </span>
                </p>
              </div>
              <p className="text-sm text-stone-700 mt-3 leading-relaxed">{item.fitSummary}</p>
              <p className="text-xs text-emerald-800 font-semibold mt-2">Open listing · walkthrough, map, fees</p>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
