import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Layout, PrimaryButton, inputClass } from '../../components/Layout';
import { loadDraft, saveDraft } from '../../state/session';
import { formatNaira } from '../../../lib/scoring';

export default function FeesAndTerms() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(loadDraft());
  const [error, setError] = useState('');

  const update = (patch: Partial<typeof draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    saveDraft(next);
  };

  const onContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.price_ngn || draft.price_ngn < 100000) {
      setError('Enter the annual rent or sale price in Naira.');
      return;
    }
    navigate('/landlord/preview');
  };

  return (
    <Layout eyebrow="Landlord · step 2 of 4">
      <form onSubmit={onContinue} className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black">Rent, agent fee, and terms</h1>
          <p className="text-stone-600 mt-2">
            Tenants will see a clear breakdown calculated from this figure.
          </p>
        </div>
        <Field
          label={draft.listing_type === 'sale' ? 'Sale price (₦)' : 'Annual rent (₦)'}
        >
          <input
            className={inputClass}
            type="number"
            min={100000}
            step={50000}
            value={draft.price_ngn}
            onChange={(e) => update({ price_ngn: Number(e.target.value) })}
          />
        </Field>
        {draft.listing_type === 'rent' ? (
          <p className="text-sm bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            From {formatNaira(draft.price_ngn || 0)} a year, tenants will see 10% caution, 10%
            agency, and 15% service charge.
          </p>
        ) : null}
        <Field label="Your agent fee note" hint="This is shown as extra information. The tenant card still uses 10% agency.">
          <input
            className={inputClass}
            value={draft.agent_fee_note}
            onChange={(e) => update({ agent_fee_note: e.target.value })}
          />
        </Field>
        <Field label="Special terms and conditions" hint="The tenant must agree to these before taking the home.">
          <textarea
            className={`${inputClass} min-h-[120px]`}
            value={draft.terms_and_conditions}
            onChange={(e) => update({ terms_and_conditions: e.target.value })}
            placeholder="e.g. No smoking. One year rent in advance. Service charge covers security and waste."
          />
        </Field>
        <Field label="Your name">
          <input className={inputClass} value={draft.landlord_name} onChange={(e) => update({ landlord_name: e.target.value })} />
        </Field>
        <Field label="Your phone number">
          <input className={inputClass} value={draft.landlord_phone} onChange={(e) => update({ landlord_phone: e.target.value })} inputMode="tel" />
        </Field>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <PrimaryButton type="submit">See fee breakdown</PrimaryButton>
      </form>
    </Layout>
  );
}
