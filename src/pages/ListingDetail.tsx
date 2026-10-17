import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Walkthrough } from '../components/Walkthrough';
import { MapView } from '../components/MapView';
import { FeeCard } from '../components/FeeCard';
import { SwotCard } from '../components/SwotCard';
import { loadSeeker } from '../state/session';
import { haversineKm, type Property } from '../../lib/scoring';
import { resolveWorkplace, type NeighborhoodReport, type SwotReport } from '../../lib/neighborhood';
import type { WalkthroughFrame } from '../../lib/walkthrough';
import { safeFetchJson } from '../utils/api';

export default function ListingDetail() {
  const { id } = useParams();
  const profile = loadSeeker();
  const work = resolveWorkplace(profile.workplace);
  const [property, setProperty] = useState<Property | null>(null);
  const [frames, setFrames] = useState<WalkthroughFrame[]>([]);
  const [report, setReport] = useState<NeighborhoodReport | null>(null);
  const [swot, setSwot] = useState<SwotReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    safeFetchJson(`/api/properties/${id}`)
      .then((d) => {
        if (!d.success) throw new Error('Listing not found');
        setProperty(d.data);
      })
      .catch((e) => setError(e.message));

    safeFetchJson(`/api/listings/${id}/walkthrough`)
      .then((d) => d.success && setFrames(d.data))
      .catch(() => {});

    safeFetchJson(`/api/listings/${id}/neighborhood`)
      .then((d) => d.success && setReport(d.data))
      .catch(() => {});

    safeFetchJson(`/api/listings/${id}/swot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    })
      .then((d) => d.success && setSwot(d.data))
      .catch(() => {});
  }, [id]);

  if (error) {
    return (
      <Layout>
        <p className="text-red-700">{error}</p>
      </Layout>
    );
  }
  if (!property) {
    return (
      <Layout>
        <p className="text-stone-500">Loading this home…</p>
      </Layout>
    );
  }

  const commuteKm =
    work && property.coordinates
      ? haversineKm(property.coordinates, work).toFixed(1)
      : null;

  return (
    <Layout eyebrow={property.neighborhood}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
            {property.listing_type === 'sale' ? 'For sale' : 'For rent'}
          </p>
          <h1 className="text-2xl font-black mt-1">{property.title}</h1>
          <p className="text-stone-600 mt-1">{property.address}</p>
        </div>

        <Walkthrough frames={frames} />

        <section>
          <h2 className="font-bold text-lg mb-2">Map, roads, and your commute</h2>
          <MapView
            lat={property.coordinates.lat}
            lng={property.coordinates.lng}
            destLat={work?.lat}
            destLng={work?.lng}
            destLabel={work?.label || profile.workplace}
          />
          {commuteKm ? (
            <p className="text-sm text-stone-600 mt-2">
              About {commuteKm} km in a straight line to {work?.label || profile.workplace}. Roads
              are shown on the map. Real travel time depends on traffic.
            </p>
          ) : (
            <p className="text-sm text-stone-600 mt-2">
              Add a workplace on your needs form to see the commute line.
            </p>
          )}
        </section>

        <FeeCard property={property} />

        {property.terms_and_conditions ? (
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h2 className="font-bold">Special terms from the landlord or agent</h2>
            <p className="text-sm mt-2 whitespace-pre-wrap">{property.terms_and_conditions}</p>
          </section>
        ) : null}

        {report ? (
          <section className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="font-bold text-lg">Neighbourhood report</h2>
            <p className="text-sm"><span className="font-semibold">Security:</span> {report.security}</p>
            <p className="text-sm"><span className="font-semibold">Electricity:</span> {report.electricity}</p>
            <p className="text-sm"><span className="font-semibold">Flood and water:</span> {report.floodAndWater}</p>
            <p className="text-sm"><span className="font-semibold">Roads:</span> {report.roads}</p>
            <div>
              <p className="font-semibold text-sm mb-1">Hospitals and clinics</p>
              <ul className="text-sm text-stone-700 space-y-1">
                {report.hospitals.map((p) => (
                  <li key={p.name}>
                    {p.name} · {p.km} km · {p.kind}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">Restaurants nearby</p>
              <ul className="text-sm text-stone-700 space-y-1">
                {report.restaurants.map((p) => (
                  <li key={p.name}>
                    {p.name} · {p.km} km
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">Other places</p>
              <ul className="text-sm text-stone-700 space-y-1">
                {report.otherFacilities.map((p) => (
                  <li key={p.name}>
                    {p.name} · {p.km} km
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {swot ? <SwotCard swot={swot} /> : <p className="text-sm text-stone-500">Writing the SWOT summary…</p>}
      </div>
    </Layout>
  );
}
