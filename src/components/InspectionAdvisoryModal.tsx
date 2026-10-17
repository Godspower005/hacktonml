import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Coins, Database, RefreshCw } from 'lucide-react';
import type { Property } from '../../lib/scoring';
import type { InspectionAdvisoryResult } from '../../lib/gemma';

interface InspectionAdvisoryModalProps {
  property: Property | null;
  onClose: () => void;
}

export const InspectionAdvisoryModal: React.FC<InspectionAdvisoryModalProps> = ({
  property,
  onClose,
}) => {
  const [advisory, setAdvisory] = useState<InspectionAdvisoryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!property) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/ai/property-advisory/${property.id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          if (data.success && data.data) {
            setAdvisory(data.data);
          } else {
            throw new Error(data.error || 'Failed to load inspection advisory');
          }
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Network error fetching inspection checklist');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [property]);

  if (!property) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-100 flex items-start justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Physical Inspection Advisory
              </span>
              {advisory && (
                <span className="text-[11px] font-medium text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded flex items-center gap-1">
                  <Database className="w-3 h-3 text-stone-600" />
                  {advisory.source === 'cache' ? 'Retrieved from /data/cache' : 'Generated once & cached'}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-stone-900 mt-1">
              {property.title}
            </h2>
            <p className="text-xs text-stone-500">
              {property.address} • {property.neighborhood}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm font-medium">Generating Ibadan tenant physical inspection advisory...</p>
              <p className="text-xs text-stone-400">Model call through lib/gemma.ts (will be saved to /data/cache)</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
              <div>
                <p className="font-semibold">Unable to load advisory</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && advisory && (
            <>
              {/* Section 1: What to verify on site */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  What to Physically Inspect On-Site
                </h3>
                <div className="space-y-2">
                  {advisory.whatToVerifyOnSite.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                      <span className="font-bold text-emerald-700 bg-emerald-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Hidden costs to clarify */}
              <div className="flex flex-col gap-2 pt-2 border-t border-stone-100">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Hidden Local Levies & Bill Verifications
                </h3>
                <div className="space-y-2">
                  {advisory.hiddenCostChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 text-xs text-stone-700">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Negotiation Tips */}
              <div className="flex flex-col gap-2 pt-2 border-t border-stone-100">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-800">
                  <Coins className="w-4 h-4 text-indigo-600" />
                  Local Rental Negotiation Advice
                </h3>
                <div className="space-y-2">
                  {advisory.negotiationTips.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs text-stone-700">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspection notes from listing */}
              {property.inspection_notes && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <span className="font-bold">Caretaker / Landlord Note: </span>
                  {property.inspection_notes}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>Cached automatically to <code className="bg-stone-200 px-1 py-0.5 rounded">/data/cache</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close Advisory
          </button>
        </div>
      </div>
    </div>
  );
};
