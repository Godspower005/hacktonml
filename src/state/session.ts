import type { NeedsProfile } from '../../lib/scoring';
import type { ListingType } from '../../lib/scoring';

const SEEKER_KEY = 'hhpal.seeker';
const DRAFT_KEY = 'hhpal.landlordDraft';

export interface LandlordDraft {
  title: string;
  listing_type: ListingType;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  property_type: 'flat' | 'duplex' | 'self-contain' | 'terrace' | 'studio';
  images: string[];
  room_labels: string[];
  price_ngn: number;
  agent_fee_note: string;
  terms_and_conditions: string;
  description: string;
  power_rating: string;
  security_level: string;
  water_source: string;
  flooding_risk: string;
  road_condition: string;
  landlord_name: string;
  landlord_phone: string;
}

export const emptyLandlordDraft = (): LandlordDraft => ({
  title: '',
  listing_type: 'rent',
  neighborhood: 'Old Bodija',
  address: '',
  lat: 7.4326,
  lng: 3.9067,
  bedrooms: 2,
  bathrooms: 2,
  property_type: 'flat',
  images: [],
  room_labels: [],
  price_ngn: 1500000,
  agent_fee_note: '10% agency fee (shown to tenants automatically)',
  terms_and_conditions: '',
  description: '',
  power_rating: 'Band B (about 12–16 hrs/day)',
  security_level: 'Gated street with night watch',
  water_source: 'Borehole',
  flooding_risk: 'Low',
  road_condition: 'Tarred access road',
  landlord_name: '',
  landlord_phone: '',
});

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function loadSeeker(): NeedsProfile {
  return readJson<NeedsProfile>(SEEKER_KEY, {});
}

export function saveSeeker(profile: NeedsProfile): void {
  localStorage.setItem(SEEKER_KEY, JSON.stringify(profile));
}

export function loadDraft(): LandlordDraft {
  return readJson(DRAFT_KEY, emptyLandlordDraft());
}

export function saveDraft(draft: LandlordDraft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
