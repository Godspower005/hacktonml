import React from 'react';
import { SlidersHorizontal, RotateCcw, Zap, Droplets, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import type { UserPreferences } from '../../lib/scoring';

interface FilterPanelProps {
  preferences: UserPreferences;
  onChangePreferences: (prefs: UserPreferences) => void;
  onReset: () => void;
  onTriggerRank: () => void;
  isRankingLoading: boolean;
}

const IBADAN_NEIGHBORHOODS = [
  'All Neighborhoods',
  'Old Bodija',
  'New Bodija',
  'Agodi GRA',
  'Iyaganku GRA',
  'Oluyole Estate',
  'Jericho GRA',
  'Samonda / Sango / UI',
  'Akobo / Oju-Irin',
  'Alalubosa GRA',
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  preferences,
  onChangePreferences,
  onReset,
  onTriggerRank,
  isRankingLoading,
}) => {
  const currentNeighborhood = preferences.preferredNeighborhoods?.[0] || 'All Neighborhoods';

  const handleNeighborhoodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChangePreferences({
      ...preferences,
      preferredNeighborhoods: val === 'All Neighborhoods' ? [] : [val],
    });
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onChangePreferences({
      ...preferences,
      maxBudget: val,
    });
  };

  const handleBedroomsChange = (beds: number) => {
    onChangePreferences({
      ...preferences,
      minBedrooms: preferences.minBedrooms === beds ? 0 : beds,
    });
  };

  const toggleToggle = (key: keyof UserPreferences) => {
    onChangePreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col gap-5">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2 text-stone-900 font-semibold text-base">
          <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
          <span>Hunt Criteria & Preferences</span>
        </div>
        <button
          onClick={onReset}
          className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1 transition-colors cursor-pointer"
          title="Reset to defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Budget Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600 font-medium">Max Annual Rent (₦ NGN)</span>
          <span className="text-emerald-700 font-bold text-base bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            ₦{((preferences.maxBudget || 3000000) / 1000000).toFixed(2)}M
          </span>
        </div>
        <input
          type="range"
          min="800000"
          max="6000000"
          step="100000"
          value={preferences.maxBudget || 3000000}
          onChange={handleBudgetChange}
          className="w-full accent-emerald-600 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-stone-400">
          <span>₦800K (Mini Flat)</span>
          <span>₦3.0M (Mid GRA)</span>
          <span>₦6.0M+ (Luxury)</span>
        </div>
      </div>

      {/* Neighborhood Dropdown */}
      <div className="flex flex-col gap-1.5">
        <label className="text-stone-600 text-xs font-semibold uppercase tracking-wider">
          Ibadan Neighborhood Focus
        </label>
        <select
          value={currentNeighborhood}
          onChange={handleNeighborhoodChange}
          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          {IBADAN_NEIGHBORHOODS.map(nh => (
            <option key={nh} value={nh}>
              {nh}
            </option>
          ))}
        </select>
      </div>

      {/* Minimum Bedrooms Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-stone-600 text-xs font-semibold uppercase tracking-wider">
          Minimum Bedrooms
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleBedroomsChange(num)}
              className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                preferences.minBedrooms === num
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {num === 1 ? '1 Bed (Mini)' : `${num} Beds`}
            </button>
          ))}
        </div>
      </div>

      {/* Ibadan Infrastructure & Quality Priority Toggles */}
      <div className="flex flex-col gap-2 pt-2 border-t border-stone-100">
        <div className="text-stone-600 text-xs font-semibold uppercase tracking-wider">
          Key Living Priorities (Plain Scoring Weights)
        </div>
        
        {/* Band A Feeder Priority */}
        <label className="flex items-center justify-between p-2 rounded-xl border border-stone-100 hover:bg-stone-50 cursor-pointer text-xs">
          <div className="flex items-center gap-2 text-stone-800">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Prioritize Band A Power (18-22h+)</span>
          </div>
          <input
            type="checkbox"
            checked={preferences.powerPriority === 'high'}
            onChange={() =>
              onChangePreferences({
                ...preferences,
                powerPriority: preferences.powerPriority === 'high' ? 'any' : 'high',
              })
            }
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
        </label>

        {/* Dedicated Prepaid Meter */}
        <label className="flex items-center justify-between p-2 rounded-xl border border-stone-100 hover:bg-stone-50 cursor-pointer text-xs">
          <div className="flex items-center gap-2 text-stone-800">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Dedicated Prepaid Meter Only</span>
          </div>
          <input
            type="checkbox"
            checked={!!preferences.requirePrepaidMeter}
            onChange={() => toggleToggle('requirePrepaidMeter')}
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
        </label>

        {/* Low/Zero Flood Risk */}
        <label className="flex items-center justify-between p-2 rounded-xl border border-stone-100 hover:bg-stone-50 cursor-pointer text-xs">
          <div className="flex items-center gap-2 text-stone-800">
            <Droplets className="w-4 h-4 text-sky-500" />
            <span>Strict Zero/Low Flood Risk</span>
          </div>
          <input
            type="checkbox"
            checked={!!preferences.requireLowFlood}
            onChange={() => toggleToggle('requireLowFlood')}
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
        </label>

        {/* Gated Security */}
        <label className="flex items-center justify-between p-2 rounded-xl border border-stone-100 hover:bg-stone-50 cursor-pointer text-xs">
          <div className="flex items-center gap-2 text-stone-800">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Gated Estate / 24/7 Security</span>
          </div>
          <input
            type="checkbox"
            checked={!!preferences.requireGatedSecurity}
            onChange={() => toggleToggle('requireGatedSecurity')}
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
        </label>

        {/* Landlord Off Compound */}
        <label className="flex items-center justify-between p-2 rounded-xl border border-stone-100 hover:bg-stone-50 cursor-pointer text-xs">
          <div className="flex items-center gap-2 text-stone-800">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <span>Landlord Lives Off-Compound</span>
          </div>
          <input
            type="checkbox"
            checked={!!preferences.preferLandlordOffCompound}
            onChange={() => toggleToggle('preferLandlordOffCompound')}
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
        </label>
      </div>

      {/* Compute Scores Button */}
      <button
        onClick={onTriggerRank}
        disabled={isRankingLoading}
        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        {isRankingLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Computing Deterministic Ranking...
          </>
        ) : (
          <>
            <span>Rank Listings by Criteria</span>
          </>
        )}
      </button>

      <div className="text-[11px] text-stone-400 text-center">
        Rankings are computed by mathematical functions in <code className="text-stone-600">lib/scoring.ts</code> (never hallucinated by AI).
      </div>
    </div>
  );
};
