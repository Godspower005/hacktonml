/**
 * Deterministic scoring, ranking, and fee math.
 * Scores and Naira totals never come from the AI model.
 */

export type ListingType = 'rent' | 'sale';

export interface Property {
  id: string;
  title: string;
  neighborhood: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  property_type: 'flat' | 'duplex' | 'self-contain' | 'terrace' | 'studio';
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  price_ngn: number;
  service_charge_ngn?: number;
  caution_fee_ngn?: number;
  legal_fee_percent?: number;
  agency_fee_percent?: number;
  listing_type?: ListingType;
  terms_and_conditions?: string;
  landlord_name?: string;
  landlord_phone?: string;
  room_labels?: string[];
  power_rating: string;
  generator_policy: string;
  prepaid_meter: boolean;
  water_source: string;
  flooding_risk: string;
  road_condition: string;
  security_level: string;
  compound_type: string;
  landlord_on_compound: boolean;
  amenities: string[];
  description: string;
  inspection_notes: string;
  images: string[];
}

export interface UserPreferences {
  maxBudget?: number;
  preferredNeighborhoods?: string[];
  propertyTypes?: string[];
  minBedrooms?: number;
  requirePrepaidMeter?: boolean;
  powerPriority?: 'any' | 'moderate' | 'high';
  requireLowFlood?: boolean;
  requireGatedSecurity?: boolean;
  preferLandlordOffCompound?: boolean;
}

export interface NeedsProfile extends UserPreferences {
  fullName?: string;
  phone?: string;
  email?: string;
  area?: string;
  workplace?: string;
  workplaceLat?: number;
  workplaceLng?: number;
  healthNeeds?: string;
  otherRequirements?: string;
  listingType?: ListingType | 'any';
}

export interface ScoreBreakdown {
  budgetScore: number;
  infrastructureScore: number;
  securityScore: number;
  locationScore: number;
  livabilityScore: number;
  healthScore: number;
}

export interface UpfrontCost {
  listingType: ListingType;
  rent: number;
  serviceCharge: number;
  cautionFee: number;
  agencyFee: number;
  legalFee: number;
  total: number;
}

export interface PropertyScoreResult {
  property: Property;
  overallScore: number;
  breakdown: ScoreBreakdown;
  upfrontCost: UpfrontCost;
  pros: string[];
  cautions: string[];
  fitSummary: string;
  commuteKm: number | null;
}

export const CAUTION_RATE = 0.1;
export const AGENCY_RATE = 0.1;
export const SERVICE_RATE = 0.15;

export function formatNaira(amount: number): string {
  const value = Number(amount) || 0;
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

export function listingTypeOf(property: Property): ListingType {
  return property.listing_type === 'sale' ? 'sale' : 'rent';
}

/**
 * Tenant-facing fee breakdown from annual rent:
 * 10% caution + 10% agency + 15% service charge.
 */
export function calculateUpfrontCost(property: Property): UpfrontCost {
  try {
    const type = listingTypeOf(property);
    const rent = Number(property.price_ngn) || 0;
    if (type === 'sale') {
      return {
        listingType: 'sale',
        rent,
        serviceCharge: 0,
        cautionFee: 0,
        agencyFee: 0,
        legalFee: 0,
        total: rent,
      };
    }
    const serviceCharge = Math.round(rent * SERVICE_RATE);
    const cautionFee = Math.round(rent * CAUTION_RATE);
    const agencyFee = Math.round(rent * AGENCY_RATE);
    return {
      listingType: 'rent',
      rent,
      serviceCharge,
      cautionFee,
      agencyFee,
      legalFee: 0,
      total: rent + serviceCharge + cautionFee + agencyFee,
    };
  } catch (err) {
    console.error('Error calculating upfront cost:', err);
    return {
      listingType: listingTypeOf(property),
      rent: property.price_ngn || 0,
      serviceCharge: 0,
      cautionFee: 0,
      agencyFee: 0,
      legalFee: 0,
      total: property.price_ngn || 0,
    };
  }
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function wantsHealthAccess(healthNeeds?: string): boolean {
  return Boolean(healthNeeds && healthNeeds.trim().length > 0);
}

export function scoreProperty(
  property: Property,
  prefs: NeedsProfile = {}
): PropertyScoreResult {
  try {
    const upfront = calculateUpfrontCost(property);
    const pros: string[] = [];
    const cautions: string[] = [];
    const type = listingTypeOf(property);

    let budgetScore = 90;
    if (prefs.maxBudget && prefs.maxBudget > 0) {
      if (type === 'sale') {
        budgetScore = property.price_ngn <= prefs.maxBudget * 8 ? 70 : 40;
        if (property.price_ngn > prefs.maxBudget) {
          cautions.push('This is a sale listing, so the price is not annual rent.');
        }
      } else if (property.price_ngn <= prefs.maxBudget) {
        budgetScore = 100;
        pros.push(`Annual rent ${formatNaira(property.price_ngn)} fits your budget`);
      } else {
        const excessPercent = ((property.price_ngn - prefs.maxBudget) / prefs.maxBudget) * 100;
        budgetScore = clamp(Math.round(100 - excessPercent * 1.8), 10);
        cautions.push(`Rent is ${excessPercent.toFixed(0)}% above your budget`);
      }
    }

    let infraPoints = 70;
    const power = (property.power_rating || '').toLowerCase();
    if (power.includes('band a') || power.includes('very high')) {
      infraPoints += 15;
      pros.push('Strong electricity hours for this area');
    } else if (power.includes('band b') || power.includes('moderate')) {
      infraPoints += 5;
    } else {
      cautions.push('Electricity may be irregular — plan for a generator or inverter');
    }

    if (property.prepaid_meter) {
      infraPoints += 8;
      pros.push('Has its own prepaid meter');
    }

    const flood = (property.flooding_risk || '').toLowerCase();
    if (flood.includes('none') || flood.includes('zero') || flood.includes('very low') || flood.includes('low')) {
      infraPoints += 5;
    } else if (flood.includes('moderate') || flood.includes('high')) {
      infraPoints -= 15;
      cautions.push('Ask about flooding in the rainy season');
    }

    const infrastructureScore = clamp(infraPoints, 10);

    let secPoints = 65;
    const secLower = (property.security_level || '').toLowerCase();
    if (secLower.includes('maximum') || secLower.includes('police') || secLower.includes('diplomatic')) {
      secPoints += 30;
      pros.push('Very high security in this neighbourhood');
    } else if (secLower.includes('gated') || secLower.includes('high') || secLower.includes('guards')) {
      secPoints += 20;
      pros.push('Gated area with guards or night watch');
    }
    const securityScore = clamp(secPoints, 10);

    let locScore = 75;
    let commuteKm: number | null = null;
    const area = (prefs.area || '').trim();
    if (area) {
      const match =
        property.neighborhood.toLowerCase().includes(area.toLowerCase()) ||
        area.toLowerCase().includes(property.neighborhood.toLowerCase());
      locScore = match ? 100 : 55;
      if (match) pros.push(`In ${property.neighborhood}, the area you asked for`);
    }
    if (prefs.preferredNeighborhoods && prefs.preferredNeighborhoods.length > 0) {
      const match = prefs.preferredNeighborhoods.some((n) =>
        property.neighborhood.toLowerCase().includes(n.toLowerCase())
      );
      locScore = match ? 100 : Math.min(locScore, 60);
    }
    if (
      typeof prefs.workplaceLat === 'number' &&
      typeof prefs.workplaceLng === 'number' &&
      property.coordinates
    ) {
      commuteKm = Number(
        haversineKm(property.coordinates, {
          lat: prefs.workplaceLat,
          lng: prefs.workplaceLng,
        }).toFixed(1)
      );
      if (commuteKm <= 4) {
        locScore = clamp(locScore + 15);
        pros.push(`About ${commuteKm} km from your daily route`);
      } else if (commuteKm <= 8) {
        locScore = clamp(locScore + 5);
        pros.push(`About ${commuteKm} km from your daily route`);
      } else {
        locScore = clamp(locScore - 10);
        cautions.push(`About ${commuteKm} km from your workplace or school`);
      }
    }
    const locationScore = clamp(locScore);

    let livScore = 75;
    if (!property.landlord_on_compound) {
      livScore += 10;
    }
    if (prefs.minBedrooms && property.bedrooms < prefs.minBedrooms) {
      livScore -= 25;
    }
    const other = (prefs.otherRequirements || '').toLowerCase();
    if (other) {
      const blob = `${property.description} ${property.amenities.join(' ')} ${property.compound_type}`.toLowerCase();
      const keywords = other.split(/[,.]/).map((s) => s.trim()).filter((s) => s.length > 3);
      const hits = keywords.filter((k) => blob.includes(k)).length;
      if (hits > 0) {
        livScore += 10;
        pros.push('Some of your extra needs appear in this listing');
      }
    }
    const livabilityScore = clamp(livScore, 10);

    let healthScore = 70;
    if (wantsHealthAccess(prefs.healthNeeds)) {
      const hospitalCue = `${property.neighborhood} ${property.description}`.toLowerCase();
      const nearHospital =
        hospitalCue.includes('uch') ||
        hospitalCue.includes('hospital') ||
        hospitalCue.includes('clinic') ||
        ['agodi gra', 'samonda', 'jericho', 'old bodija', 'new bodija'].some((n) =>
          property.neighborhood.toLowerCase().includes(n)
        );
      if (nearHospital) {
        healthScore = 92;
        pros.push('Good access to hospitals and clinics for your health needs');
      } else {
        healthScore = 58;
        cautions.push('Confirm the nearest hospital or clinic before you pay');
      }
    }

    const overallScore = Math.round(
      budgetScore * 0.28 +
        infrastructureScore * 0.2 +
        securityScore * 0.16 +
        locationScore * 0.18 +
        livabilityScore * 0.08 +
        healthScore * 0.1
    );

    const fitSummary = buildFitSummary(property, {
      overallScore,
      budgetScore,
      locationScore,
      healthScore,
      commuteKm,
      prefs,
      type,
      upfront,
    });

    return {
      property,
      overallScore,
      breakdown: {
        budgetScore,
        infrastructureScore,
        securityScore,
        locationScore,
        livabilityScore,
        healthScore,
      },
      upfrontCost: upfront,
      pros,
      cautions,
      fitSummary,
      commuteKm,
    };
  } catch (err) {
    console.error('Error scoring property:', err);
    return {
      property,
      overallScore: 50,
      breakdown: {
        budgetScore: 50,
        infrastructureScore: 50,
        securityScore: 50,
        locationScore: 50,
        livabilityScore: 50,
        healthScore: 50,
      },
      upfrontCost: calculateUpfrontCost(property),
      pros: [],
      cautions: ['Could not score this listing fully'],
      fitSummary: `${property.title} in ${property.neighborhood}. Open the page to see the map and neighbourhood report.`,
      commuteKm: null,
    };
  }
}

function buildFitSummary(
  property: Property,
  ctx: {
    overallScore: number;
    budgetScore: number;
    locationScore: number;
    healthScore: number;
    commuteKm: number | null;
    prefs: NeedsProfile;
    type: ListingType;
    upfront: UpfrontCost;
  }
): string {
  const bits: string[] = [];
  if (ctx.type === 'rent') {
    bits.push(
      `${property.bedrooms}-bedroom ${property.property_type} in ${property.neighborhood}.`
    );
    if (ctx.budgetScore >= 90 && ctx.prefs.maxBudget) {
      bits.push(`The yearly rent of ${formatNaira(property.price_ngn)} fits your budget.`);
    }
    bits.push(`Move-in total is about ${formatNaira(ctx.upfront.total)}.`);
  } else {
    bits.push(`For sale in ${property.neighborhood} at ${formatNaira(property.price_ngn)}.`);
  }
  if (ctx.commuteKm !== null) {
    bits.push(`It is about ${ctx.commuteKm} km from your workplace or school.`);
  } else if (ctx.prefs.area) {
    bits.push(`You asked to live around ${ctx.prefs.area}.`);
  }
  if (wantsHealthAccess(ctx.prefs.healthNeeds) && ctx.healthScore >= 80) {
    bits.push('Hospitals and clinics are nearby.');
  }
  bits.push(`Match score: ${ctx.overallScore} out of 100.`);
  return bits.join(' ');
}

export function rankProperties(
  properties: Property[],
  prefs: NeedsProfile = {}
): PropertyScoreResult[] {
  try {
    if (!Array.isArray(properties) || properties.length === 0) {
      return [];
    }
    const wanted = prefs.listingType && prefs.listingType !== 'any' ? prefs.listingType : 'rent';
    const pool = properties.filter((p) => {
      const type = listingTypeOf(p);
      if (prefs.listingType === 'any') return true;
      return type === wanted;
    });
    const scored = (pool.length ? pool : properties).map((p) => scoreProperty(p, prefs));
    return scored.sort((a, b) => {
      if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore;
      return a.property.price_ngn - b.property.price_ngn;
    });
  } catch (err) {
    console.error('Error ranking properties:', err);
    return [];
  }
}

export function filterProperties(
  properties: Property[],
  filters: {
    neighborhood?: string;
    propertyType?: string;
    maxPrice?: number;
    bedrooms?: number;
  }
): Property[] {
  try {
    return properties.filter((p) => {
      if (filters.neighborhood && filters.neighborhood !== 'all') {
        if (!p.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())) {
          return false;
        }
      }
      if (filters.propertyType && filters.propertyType !== 'all') {
        if (p.property_type !== filters.propertyType) return false;
      }
      if (filters.maxPrice && filters.maxPrice > 0 && p.price_ngn > filters.maxPrice) {
        return false;
      }
      if (filters.bedrooms && filters.bedrooms > 0 && p.bedrooms < filters.bedrooms) {
        return false;
      }
      return true;
    });
  } catch (err) {
    console.error('Error filtering properties:', err);
    return properties;
  }
}
