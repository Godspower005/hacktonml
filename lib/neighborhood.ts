import type { NeedsProfile, Property } from './scoring';
import { haversineKm } from './scoring';

export interface Place {
  name: string;
  kind: 'hospital' | 'clinic' | 'restaurant' | 'other';
  lat: number;
  lng: number;
}

export interface NearbyPlace extends Place {
  km: number;
}

export interface NeighborhoodRecord {
  id: string;
  name: string;
  lga?: string;
  coordinates: { lat: number; lng: number };
  vibe?: string;
  power_reliability?: string;
  power_hours_daily?: string;
  flood_risk?: string;
  road_condition?: string;
  security_level?: string;
  water_quality?: string;
  transit_access?: string;
  landmarks?: string[];
  insider_tips?: string;
}

export interface NeighborhoodReport {
  neighborhood: string;
  security: string;
  electricity: string;
  floodAndWater: string;
  roads: string;
  hospitals: NearbyPlace[];
  restaurants: NearbyPlace[];
  otherFacilities: NearbyPlace[];
}

export interface SwotBlock {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface SwotReport {
  house: SwotBlock;
  neighbourhood: SwotBlock;
  source: 'rules' | 'model' | 'cache';
}

export const COMMUTE_LANDMARKS: { id: string; label: string; lat: number; lng: number }[] = [
  { id: 'ui', label: 'University of Ibadan', lat: 7.4443, lng: 3.9003 },
  { id: 'poly', label: 'The Polytechnic Ibadan', lat: 7.4547, lng: 3.891 },
  { id: 'uch', label: 'UCH (University College Hospital)', lat: 7.4015, lng: 3.9105 },
  { id: 'secretariat', label: 'Oyo State Secretariat', lat: 7.4012, lng: 3.8964 },
  { id: 'dugbe', label: 'Dugbe', lat: 7.3869, lng: 3.8832 },
  { id: 'ring-road', label: 'Ring Road', lat: 7.3618, lng: 3.8705 },
  { id: 'iwo-road', label: 'Iwo Road', lat: 7.4035, lng: 3.948 },
  { id: 'sango', label: 'Sango', lat: 7.4268, lng: 3.8912 },
  { id: 'lead-city', label: 'Lead City University', lat: 7.3572, lng: 3.8764 },
  { id: 'ventura', label: 'Ventura Mall, Samonda', lat: 7.4358, lng: 3.8985 },
];

const CITY_PLACES: Place[] = [
  { name: 'UCH (University College Hospital)', kind: 'hospital', lat: 7.4015, lng: 3.9105 },
  { name: 'Adeoyo Specialist Hospital', kind: 'hospital', lat: 7.3872, lng: 3.8961 },
  { name: 'Jericho Nursing Home', kind: 'clinic', lat: 7.3998, lng: 3.8682 },
  { name: 'Oluyoro Catholic Hospital', kind: 'hospital', lat: 7.3924, lng: 3.9128 },
  { name: 'Reddington Hospital Ibadan', kind: 'hospital', lat: 7.401, lng: 3.879 },
  { name: 'Body & Soul Pharmacy Clinic, Bodija', kind: 'clinic', lat: 7.4305, lng: 3.911 },
  { name: 'FoodCo Bodija', kind: 'restaurant', lat: 7.4278, lng: 3.9172 },
  { name: 'The Palms / Ventura food court', kind: 'restaurant', lat: 7.4358, lng: 3.8985 },
  { name: 'Christie’s Restaurant, Oluyole', kind: 'restaurant', lat: 7.3604, lng: 3.865 },
  { name: 'Mr Bigg’s Dugbe', kind: 'restaurant', lat: 7.3875, lng: 3.884 },
  { name: 'Kilimanjaro Ring Road', kind: 'restaurant', lat: 7.3625, lng: 3.8712 },
  { name: 'Bodija Market', kind: 'other', lat: 7.4352, lng: 3.9178 },
  { name: 'Agodi Gardens', kind: 'other', lat: 7.4068, lng: 3.9088 },
  { name: 'Ibadan North Police / Housing Estate Post', kind: 'other', lat: 7.429, lng: 3.905 },
  { name: 'Iyaganku Police Division', kind: 'other', lat: 7.3785, lng: 3.8768 },
  { name: 'Aleshinloye Market', kind: 'other', lat: 7.377, lng: 3.8555 },
];

export function resolveWorkplace(text: string | undefined): {
  label: string;
  lat: number;
  lng: number;
} | null {
  if (!text) return null;
  const q = text.toLowerCase();
  const hit = COMMUTE_LANDMARKS.find(
    (p) => q.includes(p.label.toLowerCase()) || q.includes(p.id.replace('-', ' '))
  );
  if (hit) return { label: hit.label, lat: hit.lat, lng: hit.lng };

  if (q.includes('university of ibadan') || q === 'ui' || q.includes(' u.i')) {
    return COMMUTE_LANDMARKS[0];
  }
  if (q.includes('hospital') || q.includes('uch')) return COMMUTE_LANDMARKS[2];
  if (q.includes('secretariat')) return COMMUTE_LANDMARKS[3];
  if (q.includes('dugbe')) return COMMUTE_LANDMARKS[4];
  if (q.includes('ring road') || q.includes('ring-road')) return COMMUTE_LANDMARKS[5];
  if (q.includes('iwo')) return COMMUTE_LANDMARKS[6];
  if (q.includes('sango') || q.includes('poly')) return COMMUTE_LANDMARKS[7];
  return null;
}

function nearbyOfKind(
  origin: { lat: number; lng: number },
  kind: Place['kind'],
  limit = 4
): NearbyPlace[] {
  return CITY_PLACES.filter((p) => p.kind === kind)
    .map((p) => ({ ...p, km: Number(haversineKm(origin, p).toFixed(1)) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

export function buildNeighborhoodReport(
  property: Property,
  record?: NeighborhoodRecord
): NeighborhoodReport {
  const origin = property.coordinates;
  return {
    neighborhood: property.neighborhood,
    security: record?.security_level || property.security_level,
    electricity: record
      ? `${record.power_reliability || ''} — ${record.power_hours_daily || property.power_rating}`
      : property.power_rating,
    floodAndWater: record
      ? `Flood: ${record.flood_risk}. Water: ${record.water_quality}. House water: ${property.water_source}.`
      : `Flood: ${property.flooding_risk}. Water: ${property.water_source}.`,
    roads: record?.road_condition || property.road_condition,
    hospitals: [
      ...nearbyOfKind(origin, 'hospital', 3),
      ...nearbyOfKind(origin, 'clinic', 2),
    ].sort((a, b) => a.km - b.km),
    restaurants: nearbyOfKind(origin, 'restaurant', 4),
    otherFacilities: nearbyOfKind(origin, 'other', 4),
  };
}

export function buildRuleSwot(
  property: Property,
  report: NeighborhoodReport,
  profile?: NeedsProfile
): SwotReport {
  const house: SwotBlock = {
    strengths: [
      `${property.bedrooms} bedroom ${property.property_type} with ${property.amenities.slice(0, 3).join(', ') || 'basic fittings'}.`,
      property.prepaid_meter ? 'Own prepaid meter, so bills are easier to control.' : 'Ask to see how electricity is billed.',
    ],
    weaknesses: [
      property.landlord_on_compound
        ? 'Landlord lives on the compound, which some tenants find less private.'
        : 'Confirm who handles repairs when something breaks.',
    ],
    opportunities: [
      `You can inspect it on your phone first, then visit only if it still feels right.`,
    ],
    threats: [
      property.flooding_risk.toLowerCase().includes('moderate') ||
      property.flooding_risk.toLowerCase().includes('high')
        ? 'Flood risk in heavy rain — walk the compound after a downpour if you can.'
        : 'Hidden extra fees are common in Nigeria. Use the fee card before you pay.',
    ],
  };

  const neighbourhood: SwotBlock = {
    strengths: [
      report.security,
      report.electricity,
    ],
    weaknesses: [
      report.floodAndWater,
    ],
    opportunities: [
      report.hospitals[0]
        ? `Nearest hospital/clinic: ${report.hospitals[0].name} (${report.hospitals[0].km} km).`
        : 'Check hospital distance on the map.',
      report.restaurants[0]
        ? `Food nearby: ${report.restaurants[0].name} (${report.restaurants[0].km} km).`
        : 'Local food spots are mapped on the listing.',
    ],
    threats: [
      'Traffic and okada safety vary by time of day. Try the commute at the hour you would actually travel.',
    ],
  };

  if (profile?.healthNeeds) {
    neighbourhood.opportunities.unshift(
      `Your health note (“${profile.healthNeeds}”) was used to highlight nearby clinics.`
    );
  }
  if (profile?.area) {
    house.opportunities.unshift(`You asked for ${profile.area}. This home is in ${property.neighborhood}.`);
  }

  return { house, neighbourhood, source: 'rules' };
}
