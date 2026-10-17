import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout, PrimaryButton } from '../../components/Layout';
import { clearDraft, loadDraft } from '../../state/session';

export default function Published() {
  const [id, setId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const draft = loadDraft();
    fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.error || 'Publish failed');
        setId(d.data.id);
        clearDraft();
      })
      .catch((e) => setError(e.message || 'Could not publish'))
      .finally(() => setBusy(false));
  }, []);

  return (
    <Layout eyebrow="Landlord · step 4 of 4">
      <div className="flex flex-col gap-4">
        {busy ? <p>Publishing your listing…</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
        {id ? (
          <>
            <h1 className="text-2xl font-black">Your listing is live</h1>
            <p className="text-stone-600">
              Seekers can now match this home, walk through the photos, and see the fee card.
            </p>
            <Link to={`/listing/${id}`}>
              <PrimaryButton type="button">View listing</PrimaryButton>
            </Link>
            <Link to="/" className="text-center text-sm text-emerald-800 font-semibold">
              Back to home
            </Link>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
