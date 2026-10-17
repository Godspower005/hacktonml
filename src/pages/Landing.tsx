import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound } from 'lucide-react';
import { Layout } from '../components/Layout';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col gap-6 pt-4">
        <div>
          <p className="text-emerald-800 font-semibold text-sm mb-2">Your House Hunting Pal</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-900 leading-tight">
            What brings you here?
          </h1>
          <p className="mt-3 text-stone-600 text-base leading-relaxed">
            Finding a home in Nigeria should not mean wasting money on transport, hidden fees, or a
            surprise neighbourhood. We help you look first, then visit only if it feels right.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/seeker')}
          className="text-left bg-white border-2 border-stone-200 hover:border-emerald-600 rounded-3xl p-5 shadow-sm flex gap-4 items-start"
        >
          <span className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <KeyRound className="w-6 h-6" />
          </span>
          <span>
            <span className="block font-bold text-lg text-stone-900">I am looking for an apartment</span>
            <span className="block text-sm text-stone-600 mt-1">
              Tell us what you need. We will rank homes, show the real move-in cost in Naira, and
              let you walk through on your phone.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/landlord')}
          className="text-left bg-white border-2 border-stone-200 hover:border-emerald-600 rounded-3xl p-5 shadow-sm flex gap-4 items-start"
        >
          <span className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </span>
          <span>
            <span className="block font-bold text-lg text-stone-900">
              I am a landlord or agent listing a property for rent or sale
            </span>
            <span className="block text-sm text-stone-600 mt-1">
              Upload photos, pin the address on the map, set your terms, and show tenants a clear
              fee breakdown.
            </span>
          </span>
        </button>
      </div>
    </Layout>
  );
}
