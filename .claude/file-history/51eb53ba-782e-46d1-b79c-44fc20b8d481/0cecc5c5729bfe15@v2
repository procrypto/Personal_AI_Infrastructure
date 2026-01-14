# Phase 05: LLM-Powered Term Expansion

## Summary

Add LLM-powered synonym expansion for ad-hoc search terms. When users enable "semantic expansion" for search terms not in pre-defined sets, call an LLM API to generate related terms dynamically.

## Scope (Simplified from Original Roadmap)

**Original Phase 05 scope:** Full local LLM, anonymization pipeline, summarization
**Revised scope:** LLM term expansion only, user-provided API key, persistent caching

This is an MVP that delivers immediate value with minimal complexity.

## User Flow

1. User enters search term (e.g., "pricing")
2. If "Use semantic expansion" is checked:
   - Check pre-defined semantic sets first (existing behavior)
   - If no match AND API key configured → call LLM for expansion
   - Cache result persistently
3. Search with expanded terms
4. If no API key → graceful fallback to pre-defined sets only

## Implementation Plan

### Step 1: Add LLM Service Module

**New file:** `src/llmService.ts`

```typescript
export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
}

export interface ExpansionCache {
  [term: string]: {
    expansions: string[];
    timestamp: number;
  };
}

// Storage keys
const CONFIG_KEY = 'tg-ripper-llm-config';
const CACHE_KEY = 'tg-ripper-expansion-cache';

export function getLLMConfig(): LLMConfig | null;
export function setLLMConfig(config: LLMConfig): void;
export function clearLLMConfig(): void;

export function getCachedExpansion(term: string): string[] | null;
export function setCachedExpansion(term: string, expansions: string[]): void;

export async function expandTermWithLLM(
  term: string,
  config: LLMConfig
): Promise<string[]>;
```

**LLM Prompt:**
```
Given the search term "${term}", provide 5-10 synonyms and related terms
that someone might use when searching chat messages about this topic.
Return ONLY a JSON array of strings, no explanation.
Example: ["term1", "term2", "term3"]
```

**API calls:**
- OpenAI: `POST https://api.openai.com/v1/chat/completions` with gpt-4o-mini
- Anthropic: `POST https://api.anthropic.com/v1/messages` with claude-3-haiku

### Step 2: Add Settings UI for API Key

**Modify:** `src/App.tsx`

Add settings panel (collapsible) in Topic Mode section:

```
[⚙️ LLM Settings]
  Provider: [OpenAI ▼] [Anthropic]
  API Key: [••••••••••••] [Save] [Clear]
  Status: ✓ Connected / ⚠️ Not configured
```

**State variables:**
```typescript
const [llmConfig, setLlmConfigState] = useState<LLMConfig | null>(getLLMConfig());
const [showLLMSettings, setShowLLMSettings] = useState(false);
```

**Placement:** Above or below the existing "Search Settings" area, collapsed by default.

### Step 3: Integrate LLM Expansion into Search

**Modify:** `src/semanticSets.ts`

Add async expansion function:

```typescript
import { getLLMConfig, getCachedExpansion, setCachedExpansion, expandTermWithLLM } from './llmService';

// Existing sync function stays for pre-defined sets
export function expandQuery(query: string): string[] { ... }

// New async function for LLM expansion
export async function expandQueryWithLLM(query: string): Promise<string[]> {
  // 1. Start with pre-defined expansion
  const staticExpansion = expandQuery(query);

  // 2. If we got expansions from pre-defined sets, return them
  if (staticExpansion.length > 1) {
    return staticExpansion;
  }

  // 3. Check LLM config
  const config = getLLMConfig();
  if (!config) {
    return staticExpansion; // Fallback: just the original term
  }

  // 4. Check cache
  const cached = getCachedExpansion(query);
  if (cached) {
    return [...new Set([...staticExpansion, ...cached])];
  }

  // 5. Call LLM
  try {
    const llmTerms = await expandTermWithLLM(query, config);
    setCachedExpansion(query, llmTerms);
    return [...new Set([...staticExpansion, ...llmTerms])];
  } catch (error) {
    console.warn('LLM expansion failed:', error);
    return staticExpansion; // Fallback on error
  }
}
```

### Step 4: Update Search Handler

**Modify:** `src/App.tsx` - `handleSearch()`

Currently search sends to worker synchronously. Need to expand terms before sending:

```typescript
const handleSearch = async (): Promise<void> => {
  // ... existing validation ...

  setIsSearching(true);

  // Expand terms with LLM if enabled
  let expandedKeywords = keywords;
  if (useSemanticExpansion) {
    const expansionPromises = keywords.map(k => expandQueryWithLLM(k.trim()));
    const expansions = await Promise.all(expansionPromises);
    expandedKeywords = expansions.flat();
  }

  // Send to worker with pre-expanded terms
  topicWorkerRef.current?.postMessage({
    type: 'search',
    query: searchQuery,
    expandedTerms: expandedKeywords, // NEW: pass pre-expanded terms
    useSemanticExpansion: false, // Worker doesn't need to expand again
    searchMode,
    dateRange: { ... }
  });
};
```

**Alternative:** Keep expansion in worker, but that requires passing API key to worker (security concern). Better to expand in main thread.

### Step 5: Update Worker to Accept Pre-Expanded Terms

**Modify:** `src/topicWorker.ts`

Add optional `expandedTerms` to SearchRequest:

```typescript
interface SearchRequest {
  type: 'search';
  query: string;
  expandedTerms?: string[]; // NEW: pre-expanded terms from main thread
  useSemanticExpansion: boolean;
  searchMode: 'and' | 'or';
  dateRange?: { start: string | null; end: string | null };
}
```

In `searchProcess()`:
```typescript
// Use provided expanded terms, or expand locally
const terms = request.expandedTerms ??
  (request.useSemanticExpansion ? expandQuery(request.query) : [request.query]);
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/llmService.ts` | **NEW** - LLM API calls, config storage, caching |
| `src/semanticSets.ts` | Add `expandQueryWithLLM()` async function |
| `src/App.tsx` | Add LLM settings UI, update `handleSearch()` |
| `src/topicWorker.ts` | Accept pre-expanded terms in SearchRequest |
| `src/types.ts` | Add `expandedTerms` to SearchRequest interface |

## Cache Structure (localStorage)

```typescript
// Key: 'tg-ripper-llm-config'
{
  provider: 'openai' | 'anthropic',
  apiKey: string
}

// Key: 'tg-ripper-expansion-cache'
{
  "pricing": {
    expansions: ["price", "cost", "fee", "billing", "payment"],
    timestamp: 1704844800000
  },
  "refund": {
    expansions: ["return", "money back", "cancel", "chargeback"],
    timestamp: 1704844900000
  }
}
```

## Security Considerations

1. **API key storage:** localStorage is accessible to page scripts. Acceptable for user-provided keys in a local tool, but document the risk.
2. **No key in worker:** Keep API calls in main thread to avoid passing key to worker context.
3. **Rate limiting:** Add simple rate limit (e.g., max 10 expansions per minute) to prevent accidental API abuse.

## Verification

1. Configure API key in settings
2. Search for term NOT in pre-defined sets (e.g., "pricing")
3. Verify LLM is called and expansions are used
4. Search same term again → verify cache hit (no API call)
5. Clear API key → verify graceful fallback to pre-defined sets only
6. Search for term IN pre-defined sets (e.g., "bug") → verify no LLM call

## Future Extensions (Not in This Phase)

- Browser-based LLM (WebLLM) for fully local operation
- Ollama integration for local server
- Per-result summarization
- Anonymization pipeline
