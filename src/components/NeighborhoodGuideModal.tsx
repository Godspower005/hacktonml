import React, { useEffect, useState } from 'react';
import { 
  X, 
  MapPin, 
  Zap, 
  Droplets, 
  ShieldCheck, 
  Car, 
  Store, 
  Lightbulb, 
  Database,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import type { NeighborhoodGuideResult } from '../../lib/gemma';

interface NeighborhoodGuideModalProps {
  neighborhoodName: string | null;
  onClose: () => void;
}

export const NeighborhoodGuideModal: React.FC<NeighborhoodGuideModalProps> = ({
  neighborhoodName,
  onClose,
}) => {
  const [guide, setGuide] = useState<NeighborhoodGuideResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!neighborhoodName) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/ai/neighborhood-guide?name=${encodeURIComponent(neighborhoodName)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          if (data.success && data.data) {
            setGuide(data.data);
          } else {
            throw new Error(data.error || 'Failed to load neighborhood guide');
          }
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Network error fetching neighborhood guide');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [neighborhoodName]);

  if (!neighborhoodName) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-start justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                Ibadan Neighborhood Guide
              </span>
              {guide && (
                <span className="text-[11px] font-medium text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded flex items-center gap-1">
                  <Database className="w-3 h-3 text-stone-600" />
                  {guide.source === 'cache' ? 'From /data/cache' : 'Generated & cached'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-stone-900 mt-1">
              {neighborhoodName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm font-medium">Synthesizing local intelligence for {neighborhoodName}...</p>
              <p className="text-xs text-stone-400">Model call through lib/gemma.ts (saved to /data/cache)</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
              <div>
                <p className="font-semibold">Unable to load neighborhood guide</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && guide && (
            <>
              {/* Summary */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-stone-800 text-sm leading-relaxed">
                {guide.summary}
              </div>

              {/* Grid of Key Living Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Power Expectations */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Electricity Feeder & Power
                  </div>
                  <p className="text-xs text-stone-700 leading-normal">
                    {guide.powerExpectations}
                  </p>
                </div>

                {/* Water & Drainage */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 uppercase tracking-wider">
                    <Droplets className="w-4 h-4 text-sky-500" />
                    Water & Flood Drainage
                  </div>
                  <p className="text-xs text-stone-700 leading-normal">
                    {guide.waterAndDrainage}
                  </p>
                </div>

                {/* Security */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    Security & Street Gates
                  </div>
                  <p className="text-xs text-stone-700 leading-normal">
                    {guide.securityAndNightMovement}
                  </p>
                </div>

                {/* Transportation */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    <Car className="w-4 h-4 text-emerald-600" />
                    Commute & Micra Cabs
                  </div>
                  <p className="text-xs text-stone-700 leading-normal">
                    {guide.transportationAndCommute}
                  </p>
                </div>
              </div>

              {/* Hotspots */}
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-stone-600" />
                  Key Landmarks & Local Hotspots
                </div>
                <div className="flex flex-wrap gap-2">
                  {guide.localHotspots.map((spot, idx) => (
                    <span key={idx} className="bg-stone-100 border border-stone-200 text-stone-800 px-3 py-1 rounded-lg text-xs font-medium">
                      {spot}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tenant Tips */}
              <div className="flex flex-col gap-2 pt-2 border-t border-stone-100">
                <div className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  Insider Tenant Advice Before Paying
                </div>
                <div className="space-y-2">
                  {guide.tenantTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>All model calls run via <code className="bg-stone-200 px-1 py-0.5 rounded">lib/gemma.ts</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
