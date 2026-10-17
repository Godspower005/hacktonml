import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { NeedsProfile, Property, PropertyScoreResult } from './scoring';
import type { NeighborhoodReport, SwotReport } from './neighborhood';
import { buildRuleSwot } from './neighborhood';

// Cache directory location
const CACHE_DIR = path.resolve(process.cwd(), 'data', 'cache');

// Ensure cache directory exists
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Failed to initialize cache directory:', err);
}

/**
 * Generates an MD5 / SHA256 cache key from input prompt
 */
function getCacheKey(prefix: string, content: string): string {
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  // Clean prefix for safe filesystem name
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${cleanPrefix}_${hash}.json`;
}

/**
 * Checks cache for existing model output
 */
function readFromCache<T>(cacheFileName: string): T | null {
  try {
    const filePath = path.join(CACHE_DIR, cacheFileName);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.warn(`Cache read error for ${cacheFileName}:`, err);
  }
  return null;
}

/**
 * Saves model output to cache so each generation happens exactly once
 */
function writeToCache<T>(cacheFileName: string, data: T): void {
  try {
    const filePath = path.join(CACHE_DIR, cacheFileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Cache write error for ${cacheFileName}:`, err);
  }
}

/**
 * Shared client initialization for Gemma via Google AI Studio API
 */
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Helper to call Gemma model with fallback to Gemini 3.8 Flash if Gemma alias varies
 */
async function callGemmaModel(systemInstruction: string, prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const ai = getGenAIClient();
  const modelsToTry = ['gemma-2-9b-it', 'gemma-2-27b-it', 'gemini-3.8-flash'];

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} returned error, attempting fallback if available:`, err?.message || err);
    }
  }

  throw lastError || new Error('Failed to generate response from Gemma');
}

export interface NeighborhoodGuideResult {
  neighborhood: string;
  summary: string;
  powerExpectations: string;
  waterAndDrainage: string;
  securityAndNightMovement: string;
  transportationAndCommute: string;
  localHotspots: string[];
  tenantTips: string[];
  source: 'cache' | 'model' | 'fallback';
}

/**
 * Generate an insider neighborhood guide for an Ibadan area with full caching
 */
export async function getNeighborhoodGuide(
  neighborhoodName: string,
  extraContext?: string
): Promise<NeighborhoodGuideResult> {
  const cacheKey = getCacheKey('nh_guide', `${neighborhoodName}_${extraContext || ''}`);

  // 1. Check cache first
  const cached = readFromCache<NeighborhoodGuideResult>(cacheKey);
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  const systemInstruction = `You are an honest, deeply knowledgeable local housing advisor specializing in Ibadan, Oyo State, Nigeria. 
Provide realistic, unvarnished insight into living in Ibadan neighborhoods (e.g. Bodija, Agodi GRA, Iyaganku, Oluyole, Jericho, Samonda, Akobo, Alalubosa).
Focus on electricity reality (IBEDC feeders, Band A vs B vs C), water systems (borehole vs well), flood vulnerability during the Ibadan rains (Eleyele/Odo-Ona axis vs elevated ridges), security gate policies, and commute via Micra cabs, Okada, or Bolt.`;

  const prompt = `Provide a comprehensive Ibadan rental guide for the neighborhood: "${neighborhoodName}".
Context: ${extraContext || 'General rental advice'}

Format your response as valid JSON with the following structure:
{
  "neighborhood": "${neighborhoodName}",
  "summary": "2-3 concise sentences on what living here is actually like.",
  "powerExpectations": "Specific power schedule info, typical IBEDC feeder band, and backup requirements.",
  "waterAndDrainage": "Information on borehole depth, water table, and rainy season flood risk.",
  "securityAndNightMovement": "Gate closing times, vigilante dues, police visibility, and evening safety.",
  "transportationAndCommute": "Micra taxi routes, okada access, road quality, and commute to Secretariat/Dugbe.",
  "localHotspots": ["3-5 notable food spots, supermarkets, or landmarks in or near the area"],
  "tenantTips": ["3-4 actionable tips to check before signing a lease or paying landlord"]
}
Only output the JSON object, nothing else.`;

  try {
    const rawText = await callGemmaModel(systemInstruction, prompt);
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const result: NeighborhoodGuideResult = {
      neighborhood: neighborhoodName,
      summary: parsed.summary || `A distinct neighborhood in Ibadan offering residential community living.`,
      powerExpectations: parsed.powerExpectations || 'IBEDC feeder power varies; check generator policy.',
      waterAndDrainage: parsed.waterAndDrainage || 'Borehole recommended for consistent water quality.',
      securityAndNightMovement: parsed.securityAndNightMovement || 'Standard residential security with street gates.',
      transportationAndCommute: parsed.transportationAndCommute || 'Micra cabs and ride-hailing available.',
      localHotspots: Array.isArray(parsed.localHotspots) ? parsed.localHotspots : ['Local markets', 'Community centers'],
      tenantTips: Array.isArray(parsed.tenantTips) ? parsed.tenantTips : ['Test water pump and verify electricity meter'],
      source: 'model',
    };

    // Save to cache
    writeToCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`Error generating guide for ${neighborhoodName}:`, err);
    // Return robust fallback
    return {
      neighborhood: neighborhoodName,
      summary: `${neighborhoodName} is one of Ibadan's well-known residential sectors with distinct community characteristics and varying housing formats.`,
      powerExpectations: `Power availability in this sector typically depends on the local IBEDC transformer and feeder allocation (mostly 14 to 18 hours daily). Backup generator or inverter is strongly recommended.`,
      waterAndDrainage: `Most multi-unit residential properties in ${neighborhoodName} utilize private boreholes. Confirm pump automated controls and drainage during the rainy season.`,
      securityAndNightMovement: `Streets often maintain gated access managed by the Landlords and Tenants Association (CDA), typically manned from 10:00 PM until 6:00 AM.`,
      transportationAndCommute: `Accessible via Ibadan's signature red Micra taxis, tricycles, and Bolt/Uber rides. Close proximity to central transit junctions.`,
      localHotspots: ['Local neighborhood market', 'FoodCo / Supermarket', 'Community recreation space'],
      tenantTips: [
        'Inspect the apartment during or right after rain to check for roof leaks or stagnant compound water.',
        'Ask the caretaker to show the last token recharge receipt on the prepaid meter to confirm zero accumulated debts.',
        'Clarify the exact service charge inclusions (security dues, waste management, water pumping diesel).',
        'Verify if the landlord resides on the compound or manages through an accredited attorney.'
      ],
      source: 'fallback',
    };
  }
}

export interface InspectionAdvisoryResult {
  propertyId: string;
  advisoryTitle: string;
  whatToVerifyOnSite: string[];
  hiddenCostChecklist: string[];
  negotiationTips: string[];
  source: 'cache' | 'model' | 'fallback';
}

/**
 * Generate physical inspection checklist and tenant advisory for a specific property
 */
export async function getPropertyInspectionAdvisory(
  property: Property
): Promise<InspectionAdvisoryResult> {
  const cacheKey = getCacheKey('prop_advisory', `${property.id}_${property.price_ngn}`);

  // Check cache
  const cached = readFromCache<InspectionAdvisoryResult>(cacheKey);
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  const systemInstruction = `You are a real estate tenant advocate in Ibadan, Nigeria. Help tenants avoid common pitfalls like inherited prepaid meter debts, poor borehole water, transformer contributions, and exorbitant agency markups.`;

  const prompt = `Review this Ibadan listing and generate an on-site physical inspection advisory for the prospective tenant:
Property ID: ${property.id}
Title: ${property.title}
Neighborhood: ${property.neighborhood}
Rent: ₦${property.price_ngn.toLocaleString()}
Service Charge: ₦${(property.service_charge_ngn ?? Math.round(property.price_ngn * 0.15)).toLocaleString()}
Caution: ₦${(property.caution_fee_ngn ?? Math.round(property.price_ngn * 0.1)).toLocaleString()}
Power Rating: ${property.power_rating}
Water Source: ${property.water_source}
Prepaid Meter: ${property.prepaid_meter ? 'Yes' : 'No'}
Flooding Risk: ${property.flooding_risk}
Landlord on Compound: ${property.landlord_on_compound ? 'Yes' : 'No'}

Respond ONLY with a JSON object with this shape:
{
  "propertyId": "${property.id}",
  "advisoryTitle": "Clear, informative title for the inspection briefing",
  "whatToVerifyOnSite": ["4-5 specific physical inspection steps (e.g., tap water clarity, window mesh, meter display)"],
  "hiddenCostChecklist": ["3-4 financial verification checks (e.g. transformer levy, CDA dues, waste collection)"],
  "negotiationTips": ["2-3 practical tips on negotiating rent, caution fee, or agent fees in Ibadan"]
}`;

  try {
    const rawText = await callGemmaModel(systemInstruction, prompt);
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const result: InspectionAdvisoryResult = {
      propertyId: property.id,
      advisoryTitle: parsed.advisoryTitle || `Tenant Physical Inspection Advisory for ${property.title}`,
      whatToVerifyOnSite: Array.isArray(parsed.whatToVerifyOnSite) ? parsed.whatToVerifyOnSite : [],
      hiddenCostChecklist: Array.isArray(parsed.hiddenCostChecklist) ? parsed.hiddenCostChecklist : [],
      negotiationTips: Array.isArray(parsed.negotiationTips) ? parsed.negotiationTips : [],
      source: 'model',
    };

    writeToCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`Error generating inspection advisory for ${property.id}:`, err);
    return {
      propertyId: property.id,
      advisoryTitle: `Tenant Physical Inspection Advisory: ${property.title}`,
      whatToVerifyOnSite: [
        'Turn on all bathroom and kitchen taps to check water pressure and look for iron/brown discoloration from borehole tanks.',
        'Examine the dedicated prepaid meter screen for error codes, tamper indicators, or negative credit balance.',
        'Inspect ceilings and wall cornices for yellow watermarks indicating past roof seepage.',
        'Check compound slope and drainage gutters outside the gate for debris or water stagnation signs.',
        'Confirm cell phone signal reception (MTN, Airtel, Glo) inside the master bedroom and living room.'
      ],
      hiddenCostChecklist: [
        'Ask the caretaker for the monthly CDA (Community Development Association) security & waste levy.',
        'Confirm if the ₦' + (property.caution_fee_ngn || 0).toLocaleString() + ' caution fee is held in escrow and refundable.',
        'Verify if there are pending estate transformer repairs or neighborhood electrification contributions.'
      ],
      negotiationTips: [
        'Legal & agency fees in Ibadan are often quoted at 10% each (20% total), but 5-7.5% can often be negotiated for direct deals.',
        'If paying for 2 years upfront, request a 5-10% discount on the net base rent.'
      ],
      source: 'fallback',
    };
  }
}

export interface AssistantChatResponse {
  answer: string;
  suggestedAction?: string;
  source: 'cache' | 'model' | 'fallback';
}

/**
 * House hunting conversational AI assistant tailored for Ibadan house seekers
 */
export async function askHouseHuntingAssistant(
  userQuery: string,
  properties: Property[]
): Promise<AssistantChatResponse> {
  const cacheKey = getCacheKey('chat', userQuery.trim().toLowerCase());

  // Check cache
  const cached = readFromCache<AssistantChatResponse>(cacheKey);
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  const systemInstruction = `You are the Ibadan AI House Hunting Assistant. You speak with deep practical knowledge of Ibadan real estate, Nigerian Naira pricing, local areas (Bodija, Agodi GRA, Oluyole, Iyaganku, Jericho, Samonda, Akobo, Alalubosa), IBEDC power feeder bands, borehole systems, and tenant-landlord dynamics.
Keep your answers straightforward, warmly professional, and actionable. Do not use AI jargon. Always state practical considerations.`;

  const propertySummary = properties.map(p => 
    `ID: ${p.id} | ${p.title} | ${p.neighborhood} | ₦${p.price_ngn.toLocaleString()} | ${p.bedrooms} bed | Power: ${p.power_rating} | Meter: ${p.prepaid_meter ? 'Prepaid' : 'Direct'} | Flood: ${p.flooding_risk}`
  ).join('\n');

  const prompt = `User Query: "${userQuery}"

Current Database of Available Ibadan Properties:
${propertySummary}

Answer the user's question clearly. Highlight suitable properties from the list if relevant, explain local Ibadan factors (such as transportation, electricity reliability, or neighborhood vibe), and recommend next steps. Keep your response within 2-3 focused paragraphs.`;

  try {
    const rawText = await callGemmaModel(systemInstruction, prompt);
    const result: AssistantChatResponse = {
      answer: rawText.trim(),
      suggestedAction: 'View filtered listings on the interactive map',
      source: 'model',
    };

    writeToCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Error in house hunting chat:', err);
    return {
      answer: `In Ibadan, finding the right home comes down to matching your commute, power needs, and budget. For maximum power reliability and security, Bodija (Old/New), Agodi GRA, and Iyaganku GRA are top tier. If you are seeking lively family estates, Oluyole Estate is very convenient along Ring Road. For tech workers and academics, Samonda and Aerodrome Estate near Ventura Mall offer great connectivity. Check out the scored listings on the map to see upfront costs including legal and agency fees.`,
      suggestedAction: 'Filter listings by budget and preferred neighborhood',
      source: 'fallback',
    };
  }
}

function parseJsonObject(raw: string): any {
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  return JSON.parse(cleaned);
}

export async function explainListingFit(
  result: PropertyScoreResult,
  profile: NeedsProfile
): Promise<{ text: string; source: 'cache' | 'model' | 'fallback' }> {
  const cacheKey = getCacheKey(
    'fit',
    `${result.property.id}_${profile.area || ''}_${profile.maxBudget || ''}_${profile.healthNeeds || ''}`
  );
  const cached = readFromCache<{ text: string; source: 'cache' | 'model' | 'fallback' }>(cacheKey);
  if (cached) return { ...cached, source: 'cache' };

  const fallback = { text: result.fitSummary, source: 'fallback' as const };

  try {
    const raw = await callGemmaModel(
      'You help first-time renters in Nigeria. Use short, kind, plain English. Never invent prices. Never change the match score.',
      `Write 2 short sentences on why this home may fit.
Seeker: area=${profile.area || 'any'}, workplace=${profile.workplace || 'not set'}, budget=₦${profile.maxBudget || 'not set'}, health=${profile.healthNeeds || 'none'}.
Home: ${result.property.title}, ${result.property.neighborhood}, rent ₦${result.property.price_ngn}, score ${result.overallScore}/100.
Known facts: ${result.fitSummary}
Return JSON only: {"text":"..."}`
    );
    const parsed = parseJsonObject(raw);
    const text = String(parsed.text || result.fitSummary).trim();
    const payload = { text, source: 'model' as const };
    writeToCache(cacheKey, payload);
    return payload;
  } catch (err) {
    console.error('explainListingFit failed:', err);
    return fallback;
  }
}

export async function generateSwotSummary(
  property: Property,
  report: NeighborhoodReport,
  profile?: NeedsProfile
): Promise<SwotReport> {
  const cacheKey = getCacheKey('swot', `${property.id}_${profile?.area || ''}_${profile?.healthNeeds || ''}`);
  const cached = readFromCache<SwotReport>(cacheKey);
  if (cached) return { ...cached, source: 'cache' };

  const rules = buildRuleSwot(property, report, profile);

  try {
    const raw = await callGemmaModel(
      'You are a housing advisor in Ibadan, Nigeria. Be honest. Use simple words. Do not invent numbers or hospitals.',
      `Create a SWOT for the house and the neighbourhood.
House: ${property.title}, ${property.address}, power=${property.power_rating}, flood=${property.flooding_risk}, security=${property.security_level}.
Area report: electricity=${report.electricity}; flood/water=${report.floodAndWater}; security=${report.security}.
Seeker needs: ${JSON.stringify({
        area: profile?.area,
        workplace: profile?.workplace,
        healthNeeds: profile?.healthNeeds,
        otherRequirements: profile?.otherRequirements,
      })}
Return JSON only:
{
  "house": { "strengths": ["..."], "weaknesses": ["..."], "opportunities": ["..."], "threats": ["..."] },
  "neighbourhood": { "strengths": ["..."], "weaknesses": ["..."], "opportunities": ["..."], "threats": ["..."] }
}`
    );
    const parsed = parseJsonObject(raw);
    const result: SwotReport = {
      house: {
        strengths: parsed.house?.strengths || rules.house.strengths,
        weaknesses: parsed.house?.weaknesses || rules.house.weaknesses,
        opportunities: parsed.house?.opportunities || rules.house.opportunities,
        threats: parsed.house?.threats || rules.house.threats,
      },
      neighbourhood: {
        strengths: parsed.neighbourhood?.strengths || rules.neighbourhood.strengths,
        weaknesses: parsed.neighbourhood?.weaknesses || rules.neighbourhood.weaknesses,
        opportunities: parsed.neighbourhood?.opportunities || rules.neighbourhood.opportunities,
        threats: parsed.neighbourhood?.threats || rules.neighbourhood.threats,
      },
      source: 'model',
    };
    writeToCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error('generateSwotSummary failed:', err);
    return rules;
  }
}
