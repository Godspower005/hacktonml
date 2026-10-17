# Ibadan AI House Hunting Assistant

An open-source AI house hunting assistant tailored for renters and home seekers in **Ibadan, Oyo State, Nigeria**. It features transparent upfront cost breakdowns, neighborhood infrastructure profiling (IBEDC feeder bands, flood risk, borehole quality), deterministic ranking functions, and an interactive Leaflet map.

---

## Architecture & Design Principles

- **Plain Deterministic Scoring (`lib/scoring.ts`)**: All match scores, upfront cost calculations, and listing rankings are computed using deterministic mathematical functions. They **never** come from the AI model.
- **Model Isolation (`lib/gemma.ts`)**: All AI model calls strictly route through `lib/gemma.ts` using the Google AI Studio API (`@google/genai`).
- **One-Time Generation Caching (`/data/cache`)**: Every model response (inspection checklists, neighborhood intelligence guides, assistant answers) is saved to `/data/cache/<sha256>.json` and retrieved on subsequent requests without invoking the API again.
- **Upfront Fee Transparency**: Calculates total move-in costs in Nigerian Naira (Rent + Service Charge + Caution Fee + 10% Legal + 10% Agency).
- **Interactive Leaflet Map**: Visualizes property locations across Ibadan (Old Bodija, New Bodija, Agodi GRA, Iyaganku GRA, Oluyole Estate, Jericho, Samonda, and Akobo).

---

## Prerequisites

- **Node.js**: Version 18.0.0 or higher (v20+ recommended)
- **Package Manager**: `npm` (included with Node.js)
- **Google AI Studio API Key**: Required for generating new model outputs via `lib/gemma.ts` (cached outputs work without an active key).

---

## Local Deployment Steps

### 1. Clone & Navigate to Project

```bash
git clone https://github.com/your-username/ibadan-house-hunting-assistant.git
cd ibadan-house-hunting-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and add your Google AI Studio API key:

```bash
cp .env.example .env
```

Open `.env` in an editor and set your API key:

```env
GEMINI_API_KEY="your_google_ai_studio_api_key_here"
PORT=3000
```

> **Note:** If you don't provide an API key, the app will continue to run normally using pre-cached responses and local fallback knowledge in `lib/gemma.ts`.

### 4. Start Development Server

```bash
npm run dev
```

The application will be live at:
**[http://localhost:3000](http://localhost:3000)**

---

## Production Build & Run

To create an optimized production build:

```bash
# 1. Build the frontend
npm run build

# 2. Start the production server
npm start
```

The server serves the compiled client assets and mounts the backend API endpoints on port `3000`.

---

## Project Structure

```text
├── data/
│   ├── properties.json        # Ibadan property listings with Nigerian rental terms
│   ├── neighborhoods.json     # Neighborhood profiles (power bands, flood safety, transit)
│   └── cache/                 # Saved Gemma AI responses (one file per generation)
├── lib/
│   ├── gemma.ts               # Google AI Studio API bridge with /data/cache caching
│   └── scoring.ts             # Deterministic ranking and upfront move-in cost calculations
├── src/
│   ├── components/
│   │   ├── AiAssistantChat.tsx           # House hunting AI advisor interface
│   │   ├── FilterPanel.tsx               # Budget, power, and infrastructure controls
│   │   ├── IbadanMap.tsx                 # Leaflet interactive map component
│   │   ├── InspectionAdvisoryModal.tsx   # Physical inspection due-diligence modal
│   │   ├── NeighborhoodGuideModal.tsx    # Neighborhood overview modal
│   │   └── PropertyCard.tsx              # Property card with cost breakdowns
│   ├── App.tsx                           # Main application layout
│   └── main.tsx                          # React entry point
├── server.ts                  # Express full-stack API server + Vite middleware
├── package.json
└── README.md
```

---

## How to Test

### 1. Testing the Web UI
1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. **Filter & Rank**: Move the **Max Annual Rent** slider or select a neighborhood (e.g., *Old Bodija*). Click **Rank Listings by Criteria** to observe instantaneous deterministic sorting via `lib/scoring.ts`.
3. **Upfront Cost**: Expand the **Total Move-In Upfront** chevron on any property card to view the itemized breakdown.
4. **AI Inspection Advisory**: Click **Inspection Advisory** on a listing. The first click calls the model and writes to `/data/cache`. Subsequent clicks load directly from cache with `Retrieved from /data/cache`.
5. **Interactive Map**: Click on any map marker in Ibadan to highlight the listing and inspect coordinates.

### 2. Testing API Endpoints via cURL

Test properties retrieval:
```bash
curl -s http://localhost:3000/api/properties
```

Test deterministic scoring (returns ranked array):
```bash
curl -s -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{"preferences": {"maxBudget": 2500000, "powerPriority": "high"}}'
```

Test cached AI neighborhood guide:
```bash
curl -s "http://localhost:3000/api/ai/neighborhood-guide?name=Old+Bodija"
```

Inspect cache status:
```bash
curl -s http://localhost:3000/api/cache-stats
```

---

## License

Open Source under Apache 2.0.
