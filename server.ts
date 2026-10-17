import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import {
  Property,
  NeedsProfile,
  rankProperties,
  calculateUpfrontCost,
} from './lib/scoring.ts';

import {
  getNeighborhoodGuide,
  getPropertyInspectionAdvisory,
  askHouseHuntingAssistant,
  explainListingFit,
  generateSwotSummary,
} from './lib/gemma.ts';

import {
  NeighborhoodRecord,
  buildNeighborhoodReport,
  buildRuleSwot,
  resolveWorkplace,
} from './lib/neighborhood.ts';

import { buildWalkthrough } from './lib/walkthrough.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '12mb' }));

const uploadsDir = path.resolve(__dirname, 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

function loadJsonFile<T>(relativePath: string, fallback: T): T {
  try {
    const fullPath = path.resolve(__dirname, relativePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error loading JSON file ${relativePath}:`, err);
  }
  return fallback;
}

function saveJsonFile(relativePath: string, data: unknown): void {
  const fullPath = path.resolve(__dirname, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
}

function allProperties(): Property[] {
  const seed = loadJsonFile<Property[]>('data/properties.json', []);
  const extra = loadJsonFile<Property[]>('data/listings.json', []);
  return [...extra, ...seed];
}

function findProperty(id: string): Property | undefined {
  return allProperties().find((p) => p.id === id);
}

function withWorkplace(profile: NeedsProfile): NeedsProfile {
  if (typeof profile.workplaceLat === 'number' && typeof profile.workplaceLng === 'number') {
    return profile;
  }
  const resolved = resolveWorkplace(profile.workplace);
  if (!resolved) return profile;
  return { ...profile, workplaceLat: resolved.lat, workplaceLng: resolved.lng };
}

app.get('/api/properties', (_req: Request, res: Response) => {
  try {
    const properties = allProperties();
    res.json({ success: true, count: properties.length, data: properties });
  } catch (err: any) {
    console.error('Failed to fetch properties:', err);
    res.status(500).json({ success: false, error: 'Could not load properties data' });
  }
});

app.get('/api/properties/:id', (req: Request, res: Response) => {
  try {
    const found = findProperty(req.params.id);
    if (!found) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }
    const upfront = calculateUpfrontCost(found);
    res.json({ success: true, data: found, upfront });
  } catch (err: any) {
    console.error(`Failed to fetch property ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: 'Could not load property details' });
  }
});

app.get('/api/neighborhoods', (_req: Request, res: Response) => {
  try {
    const neighborhoods = loadJsonFile<any[]>('data/neighborhoods.json', []);
    res.json({ success: true, count: neighborhoods.length, data: neighborhoods });
  } catch (err: any) {
    console.error('Failed to fetch neighborhoods:', err);
    res.status(500).json({ success: false, error: 'Could not load neighborhoods data' });
  }
});

app.post('/api/score', (req: Request, res: Response) => {
  try {
    const preferences: NeedsProfile = withWorkplace(req.body.preferences || req.body.profile || {});
    let properties: Property[] = req.body.properties;
    if (!Array.isArray(properties) || properties.length === 0) {
      properties = allProperties();
    }
    const rankedResults = rankProperties(properties, preferences);
    res.json({ success: true, count: rankedResults.length, data: rankedResults });
  } catch (err: any) {
    console.error('Failed to rank properties:', err);
    res.status(500).json({ success: false, error: 'Failed to rank properties' });
  }
});

app.post('/api/match', async (req: Request, res: Response) => {
  try {
    const profile = withWorkplace((req.body.profile || {}) as NeedsProfile);
    const ranked = rankProperties(allProperties(), profile);
    const top = ranked.slice(0, 12);
    const withCopy = await Promise.all(
      top.map(async (item) => {
        try {
          const explained = await explainListingFit(item, profile);
          return { ...item, fitSummary: explained.text, fitSource: explained.source };
        } catch {
          return { ...item, fitSource: 'fallback' };
        }
      })
    );
    res.json({ success: true, count: withCopy.length, data: withCopy });
  } catch (err: any) {
    console.error('Failed to match listings:', err);
    res.status(500).json({ success: false, error: 'Failed to match listings' });
  }
});

app.post('/api/seekers', (req: Request, res: Response) => {
  try {
    const seekers = loadJsonFile<any[]>('data/seekers.json', []);
    const record = {
      id: `sk-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    seekers.unshift(record);
    saveJsonFile('data/seekers.json', seekers.slice(0, 200));
    res.json({ success: true, data: record });
  } catch (err: any) {
    console.error('Failed to save seeker:', err);
    res.status(500).json({ success: false, error: 'Could not save your details' });
  }
});

app.post('/api/listings', (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const id = `user-${Date.now()}`;
    const images: string[] = Array.isArray(body.images) ? body.images : [];
    const storedImages = images.slice(0, 8).map((img: string, i: number) => {
      if (typeof img === 'string' && img.startsWith('data:')) {
        const match = img.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (!match) return img;
        const ext = match[1].includes('png') ? 'png' : 'jpg';
        const fileName = `${id}-${i}.${ext}`;
        fs.writeFileSync(path.join(uploadsDir, fileName), Buffer.from(match[2], 'base64'));
        return `/uploads/${fileName}`;
      }
      return img;
    });

    const listing: Property = {
      id,
      title: String(body.title || 'New listing').slice(0, 120),
      neighborhood: String(body.neighborhood || 'Ibadan'),
      address: String(body.address || ''),
      coordinates: {
        lat: Number(body.lat) || 7.4019,
        lng: Number(body.lng) || 3.9,
      },
      property_type: body.property_type || 'flat',
      bedrooms: Number(body.bedrooms) || 1,
      bathrooms: Number(body.bathrooms) || 1,
      toilets: Number(body.toilets) || Number(body.bathrooms) || 1,
      price_ngn: Number(body.price_ngn) || 0,
      listing_type: body.listing_type === 'sale' ? 'sale' : 'rent',
      terms_and_conditions: String(body.terms_and_conditions || ''),
      landlord_name: String(body.landlord_name || ''),
      landlord_phone: String(body.landlord_phone || ''),
      room_labels: Array.isArray(body.room_labels) ? body.room_labels : [],
      power_rating: String(body.power_rating || 'Ask the agent about daily power hours'),
      generator_policy: String(body.generator_policy || 'Confirm generator rules on inspection'),
      prepaid_meter: Boolean(body.prepaid_meter),
      water_source: String(body.water_source || 'Ask about borehole or well'),
      flooding_risk: String(body.flooding_risk || 'Ask neighbours about rain season'),
      road_condition: String(body.road_condition || 'See map for nearby roads'),
      security_level: String(body.security_level || 'Ask about night security'),
      compound_type: String(body.compound_type || 'Residential compound'),
      landlord_on_compound: Boolean(body.landlord_on_compound),
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      description: String(body.description || 'Listed by a landlord or agent on Your House Hunting Pal.'),
      inspection_notes: String(body.inspection_notes || 'Use the virtual walkthrough, then visit if it still fits.'),
      images: storedImages.length
        ? storedImages
        : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
    };

    const listings = loadJsonFile<Property[]>('data/listings.json', []);
    listings.unshift(listing);
    saveJsonFile('data/listings.json', listings);
    res.json({
      success: true,
      data: listing,
      upfront: calculateUpfrontCost(listing),
    });
  } catch (err: any) {
    console.error('Failed to publish listing:', err);
    res.status(500).json({ success: false, error: 'Could not publish listing' });
  }
});

app.get('/api/listings/:id/walkthrough', (req: Request, res: Response) => {
  const found = findProperty(req.params.id);
  if (!found) {
    res.status(404).json({ success: false, error: 'Property not found' });
    return;
  }
  res.json({ success: true, data: buildWalkthrough(found) });
});

app.get('/api/listings/:id/neighborhood', (req: Request, res: Response) => {
  const found = findProperty(req.params.id);
  if (!found) {
    res.status(404).json({ success: false, error: 'Property not found' });
    return;
  }
  const neighborhoods = loadJsonFile<NeighborhoodRecord[]>('data/neighborhoods.json', []);
  const record = neighborhoods.find((n) =>
    found.neighborhood.toLowerCase().includes(n.name.toLowerCase().split('/')[0].trim())
  );
  const report = buildNeighborhoodReport(found, record);
  res.json({ success: true, data: report, record: record || null });
});

app.post('/api/listings/:id/swot', async (req: Request, res: Response) => {
  try {
    const found = findProperty(req.params.id);
    if (!found) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }
    const profile = withWorkplace((req.body.profile || {}) as NeedsProfile);
    const neighborhoods = loadJsonFile<NeighborhoodRecord[]>('data/neighborhoods.json', []);
    const record = neighborhoods.find((n) =>
      found.neighborhood.toLowerCase().includes(n.name.toLowerCase().split('/')[0].trim())
    );
    const report = buildNeighborhoodReport(found, record);
    const swot = await generateSwotSummary(found, report, profile);
    res.json({ success: true, data: swot });
  } catch (err: any) {
    console.error('SWOT failed:', err);
    const found = findProperty(req.params.id);
    if (!found) {
      res.status(500).json({ success: false, error: 'Failed to build SWOT' });
      return;
    }
    const report = buildNeighborhoodReport(found);
    res.json({ success: true, data: buildRuleSwot(found, report, req.body.profile) });
  }
});

app.get('/api/ai/neighborhood-guide', async (req: Request, res: Response) => {
  try {
    const name = String(req.query.name || 'Old Bodija');
    const extraContext = req.query.context ? String(req.query.context) : undefined;
    const guide = await getNeighborhoodGuide(name, extraContext);
    res.json({ success: true, data: guide });
  } catch (err: any) {
    console.error('Failed to fetch neighborhood guide:', err);
    res.status(500).json({ success: false, error: 'Failed to generate neighborhood guide' });
  }
});

app.get('/api/ai/property-advisory/:id', async (req: Request, res: Response) => {
  try {
    const found = findProperty(req.params.id);
    if (!found) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }
    const advisory = await getPropertyInspectionAdvisory(found);
    res.json({ success: true, data: advisory });
  } catch (err: any) {
    console.error(`Failed to fetch advisory for property ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: 'Failed to generate property inspection checklist' });
  }
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const query = String(req.body.query || '').trim();
    if (!query) {
      res.status(400).json({ success: false, error: 'Query parameter is required' });
      return;
    }
    const response = await askHouseHuntingAssistant(query, allProperties());
    res.json({ success: true, data: response });
  } catch (err: any) {
    console.error('Failed to process AI chat query:', err);
    res.status(500).json({ success: false, error: 'Failed to process house hunting query' });
  }
});

app.get('/api/cache-stats', (_req: Request, res: Response) => {
  try {
    const cacheDir = path.resolve(__dirname, 'data', 'cache');
    if (!fs.existsSync(cacheDir)) {
      res.json({ success: true, count: 0, files: [] });
      return;
    }
    const files = fs.readdirSync(cacheDir).filter((f) => f.endsWith('.json'));
    res.json({
      success: true,
      count: files.length,
      files,
      location: '/data/cache',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to read cache stats' });
  }
});

// API 404 handler to prevent HTML responses for missing /api endpoints
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Express error handling middleware for API routes
app.use((err: any, req: Request, res: Response, next: any) => {
  if (req.path && req.path.startsWith('/api')) {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
    return;
  }
  next(err);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Your House Hunting Pal running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
