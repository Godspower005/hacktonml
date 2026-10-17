import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Layout, PrimaryButton, inputClass } from '../../components/Layout';
import { loadSeeker, saveSeeker } from '../../state/session';
import { safeFetchJson } from '../../utils/api';

export default function InfoSheet() {
  const navigate = useNavigate();
  const existing = loadSeeker();
  const [fullName, setFullName] = useState(existing.fullName || '');
  const [phone, setPhone] = useState(existing.phone || '');
  const [email, setEmail] = useState(existing.email || '');
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill your name, phone number, and email.');
      return;
    }
    const profile = { ...existing, fullName: fullName.trim(), phone: phone.trim(), email: email.trim() };
    saveSeeker(profile);
    try {
      await safeFetchJson('/api/seekers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch {
      /* local save is enough for the demo */
    }
    navigate('/seeker/needs');
  };

  return (
    <Layout eyebrow="Step 1 of 2">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black">A short information sheet</h1>
          <p className="text-stone-600 mt-2">
            We only use this to remember you on this phone. No password needed.
          </p>
        </div>
        <Field label="Full name">
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Adaeze Okafor" />
        </Field>
        <Field label="Phone number" hint="A Nigerian number we can reach you on later.">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0803 000 0000" inputMode="tel" />
        </Field>
        <Field label="Email address">
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </Field>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <PrimaryButton type="submit">Continue</PrimaryButton>
      </form>
    </Layout>
  );
}
