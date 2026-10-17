import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, PrimaryButton } from '../../components/Layout';
import { FeeCard } from '../../components/FeeCard';
import { loadDraft } from '../../state/session';
import type { Property } from '../../../lib/scoring';

export default function FeeBreakdownPage() {
  const navigate = useNavigate();
  const draft = loadDraft();

  const preview: Property = {
    id: 'preview',
    title: draft.title,
    neighborhood: draft.neighborhood,
    address: draft.address,
    coordinates: { lat: draft.lat, lng: draft.lng },
    property_type: draft.property_type,
    bedrooms: draft.bedrooms,
    bathrooms: draft.bathrooms,
    toilets: draft.bathrooms,
    price_ngn: draft.price_ngn,
    listing_type: draft.listing_type,
    terms_and_conditions: draft.terms_and_conditions,
    power_rating: draft.power_rating,
    generator_policy: 'Confirm on inspection',
    prepaid_meter: true,
    water_source: draft.water_source,
    flooding_risk: draft.flooding_risk,
    road_condition: draft.road_condition,
    security_level: draft.security_level,
    compound_type: 'Residential',
    landlord_on_compound: false,
    amenities: [],
    description: draft.description,
    inspection_notes: '',
    images: draft.images,
  };

  return (
    <Layout eyebrow="Landlord · step 3 of 4">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black">This is what every tenant will see</h1>
          <p className="text-stone-600 mt-2">
            Check the numbers. If they look right, publish the listing.
          </p>
        </div>
        <FeeCard property={preview} />
        {draft.agent_fee_note ? (
          <p className="text-sm text-stone-600">Agent note: {draft.agent_fee_note}</p>
        ) : null}
        {draft.terms_and_conditions ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-4">
            <h2 className="font-bold">Terms the tenant must agree to</h2>
            <p className="text-sm mt-2 whitespace-pre-wrap">{draft.terms_and_conditions}</p>
          </div>
        ) : null}
        <PrimaryButton type="button" onClick={() => navigate('/landlord/publish')}>
          Publish listing
        </PrimaryButton>
      </div>
    </Layout>
  );
}
