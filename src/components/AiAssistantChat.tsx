import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, Database, AlertCircle, RefreshCw } from 'lucide-react';
import type { AssistantChatResponse } from '../../lib/gemma';
import { safeFetchJson } from '../utils/api';

interface AiAssistantChatProps {
  onQuickFilter?: (query: string) => void;
}

const SAMPLE_QUESTIONS = [
  'Best area near Secretariat with Band A power under 2.5M?',
  'Old Bodija vs Oluyole Estate for remote work?',
  'What hidden fees exist in Ibadan rentals besides rent?',
  'Safe neighborhood for a young tech professional with good nightlife?',
];

export const AiAssistantChat: React.FC<AiAssistantChatProps> = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AssistantChatResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState('');

  const handleAsk = async (questionToAsk?: string) => {
    const q = (questionToAsk || query).trim();
    if (!q || isLoading) return;

    setActiveQuery(q);
    setIsLoading(true);
    setError(null);

    try {
      const data = await safeFetchJson('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (data.success && data.data) {
        setResponse(data.data);
      } else {
        throw new Error(data.error || 'Failed to process query');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with assistant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm">
              Ibadan House Hunting AI Advisor
            </h3>
            <p className="text-[11px] text-stone-500">
              Powered by Gemma via Google AI Studio API • Cached to <code className="bg-stone-100 px-1 py-0.2 rounded">/data/cache</code>
            </p>
          </div>
        </div>

        {response && (
          <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded flex items-center gap-1">
            <Database className="w-3 h-3 text-stone-600" />
            {response.source === 'cache' ? 'From /data/cache' : 'Generated & cached'}
          </span>
        )}
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          Suggested Ibadan Inquiries
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(q);
                handleAsk(q);
              }}
              className="text-xs px-2.5 py-1 bg-stone-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-stone-200 rounded-lg text-stone-700 transition-colors text-left cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about areas, power tariffs, flood zones, or rents in Ibadan..."
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:text-stone-400"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </>
          )}
        </button>
      </form>

      {/* Loading state */}
      {isLoading && (
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-3 text-stone-600 text-xs">
          <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
          <span>Consulting Ibadan real estate advisory knowledge base (calling lib/gemma.ts)...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Answer Output */}
      {response && !isLoading && (
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col gap-2 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span className="font-semibold text-stone-700">Advisor Consultation:</span>
            <span>"{activeQuery}"</span>
          </div>
          <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-line">
            {response.answer}
          </div>
          {response.suggestedAction && (
            <div className="pt-2 border-t border-stone-200/80 text-[11px] text-emerald-800 font-medium flex items-center gap-1">
              <span>Next Step:</span>
              <span>{response.suggestedAction}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
