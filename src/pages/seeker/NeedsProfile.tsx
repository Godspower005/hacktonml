import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Layout, PrimaryButton, inputClass } from '../../components/Layout';
import { COMMUTE_LANDMARKS } from '../../../lib/neighborhood';
import { loadSeeker, saveSeeker } from '../../state/session';
import { safeFetchJson } from '../../utils/api';

export default function NeedsProfilePage() {
  const navigate = useNavigate();
  const existing = loadSeeker();
  const [areas, setAreas] = useState<string[]>([
    'Old Bodija',
    'New Bodija',
    'Agodi GRA',
    'Iyaganku GRA',
    'Oluyole Estate',
    'Jericho GRA',
    'Samonda / Sango / UI',
    'Akobo / Oju-Irin',
    'Alalubosa GRA',
  ]);
  const [area, setArea] = useState(existing.area || '');
  const [workplace, setWorkplace] = useState(existing.workplace || '');
  const [maxBudget, setMaxBudget] = useState(String(existing.maxBudget || 2000000));
  const [healthNeeds, setHealthNeeds] = useState(existing.healthNeeds || '');
  const [otherRequirements, setOtherRequirements] = useState(existing.otherRequirements || '');
  const [error, setError] = useState('');

  useEffect(() => {
    safeFetchJson('/api/neighborhoods')
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setAreas(d.data.map((n: { name: string }) => n.name));
        }
      })
      .catch(() => {});
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budget = Number(maxBudget);
    if (!area.trim()) {
      setError('Please choose the area you want to live in.');
      return;
    }
    if (!budget || budget < 100000) {
      setError('Please enter a yearly budget in Naira.');
      return;
    }
    saveSeeker({
      ...existing,
      area: area.trim(),
      preferredNeighborhoods: [area.trim()],
      workplace: workplace.trim(),
      maxBudget: budget,
      healthNeeds: healthNeeds.trim(),
      otherRequirements: otherRequirements.trim(),
      listingType: 'rent',
    });
    navigate('/seeker/matches');
  };

  return (
    <Layout eyebrow="Step 2 of 2">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black">Tell us what you need</h1>
          <p className="text-stone-600 mt-2">
            We use this to rank homes. The score is calculated with a simple formula, not a guess.
          </p>
        </div>
        <Field label="Area you want to live in">
          <select className={inputClass} value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Choose an area in Ibadan</option>
            {areas.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Workplace or daily route"
          hint="Example: University of Ibadan, UCH, Secretariat, or Ring Road."
        >
          <input
            className={inputClass}
            list="landmarks"
            value={workplace}
            onChange={(e) => setWorkplace(e.target.value)}
            placeholder="From home to school or work"
          />
          <datalist id="landmarks">
            {COMMUTE_LANDMARKS.map((p) => (
              <option key={p.id} value={p.label} />
            ))}
          </datalist>
        </Field>
        <Field label="Yearly budget (₦)" hint="This is annual rent, not monthly.">
          <input
            className={inputClass}
            type="number"
            min={100000}
            step={50000}
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
        </Field>
        <Field
          label="Health needs"
          hint="Optional. We will put hospitals and clinics first on the listing page."
        >
          <textarea
            className={`${inputClass} min-h-[88px]`}
            value={healthNeeds}
            onChange={(e) => setHealthNeeds(e.target.value)}
            placeholder="e.g. I need to be near a hospital for check-ups"
          />
        </Field>
        <Field label="Any other personal requirements">
          <textarea
            className={`${inputClass} min-h-[88px]`}
            value={otherRequirements}
            onChange={(e) => setOtherRequirements(e.target.value)}
            placeholder="e.g. prepaid meter, quiet street, two toilets"
          />
        </Field>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <PrimaryButton type="submit">Show homes that fit</PrimaryButton>
      </form>
    </Layout>
  );
}
