# LOIS-Ready Paper Trading Architecture

## Summary

Prepare the token-analysis-autopilot paper trading system for future LOIS integration by the PUM3 team. Focus on documentation, LOIS-compatible data structures, and clear integration points—without building LOIS functionality ourselves.

## Guiding Principles

1. **Don't replace LOIS** - If LOIS already handles something (slippage, priority, execution), let it continue
2. **Build LOIS-compatibly** - Structure data and types to align with LOIS conventions
3. **Stop short of LOIS code** - Don't build NATS clients, intent creation, or execution bridges
4. **Document integration points** - Make it easy for PUM3 team to understand where/how to integrate

## Architecture: Autopilot ↔ LOIS Boundary

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTOPILOT (this repo)                       │
│                                                                 │
│  Signal Detection → Rule Engine → TriggerEvent → PaperTracker  │
│                                        │                        │
│                                        ▼                        │
│                          [LOIS INTEGRATION POINT]               │
│                          trigger.ts:144-157                     │
│                          mode === 'live'                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ TriggerEvent (documented, LOIS-compatible)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOIS (pum3 repo)                           │
│                      (PUM3 team builds)                         │
│                                                                 │
│  Subscribe to events → Create Intent → Execution → Blockchain  │
│                                                                 │
│  LOIS handles: user_id, wallet, slippage, priority, MEV        │
└─────────────────────────────────────────────────────────────────┘
```

## What We Build vs What LOIS Builds

| Component | We Build | LOIS Team Builds |
|-----------|----------|------------------|
| Signal detection (rules, magic buy/exit) | ✓ | |
| TriggerEvent with full context | ✓ | |
| Paper trade tracking | ✓ | |
| Integration point documentation | ✓ | |
| NATS subscription to events | | ✓ |
| TriggerEvent → Intent conversion | | ✓ |
| User/wallet binding | | ✓ |
| Slippage/priority handling | | ✓ |
| Swap execution | | ✓ |

---

## Implementation Phases

### Phase 1: Enhance TriggerEvent for LOIS Compatibility

**File:** `src/trading/types.ts`

Review and enhance `TriggerEvent` to include all context LOIS would need:

```typescript
export interface TriggerEvent {
  // Timing
  timestamp: number;              // Unix ms - matches LOIS convention

  // Token identification (LOIS uses Pubkey as base58 string)
  mint: string;                   // Base58 Solana address
  symbol: string;                 // Human-readable symbol

  // Trade intent
  action: 'buy' | 'sell';         // Direction

  // Signal context (unique to autopilot - LOIS would use this to create new intent type)
  ruleSetId: string;              // Which strategy triggered
  signals: Array<{
    ruleId: string;
    ruleName: string;
    reason: string;
    strength: number;             // 0-1 confidence
  }>;
  confidence: number;             // Aggregate confidence 0-1

  // Market context at trigger time
  marketContext: {
    priceSol: number;             // Price when signal fired
    priceUsd: number;
    marketCapUsd?: number;        // If available - LOIS uses market cap triggers
  };

  // Position sizing recommendation
  recommendedPositionSizeSol: number;  // Autopilot's sizing recommendation

  // Execution status
  triggered: boolean;
  reason?: string;                // Why not triggered (if false)
  tradeId?: string;               // Paper trade ID (if triggered in paper mode)
}
```

**Changes:**
- Add `marketContext` block with prices at trigger time
- Add `recommendedPositionSizeSol` (LOIS can use or override)
- Ensure `mint` is base58 string format (not Pubkey object)
- Add optional `marketCapUsd` for LOIS compatibility

---

### Phase 2: Document Integration Points

**File:** `src/trading/trigger.ts`

Add comprehensive documentation at the LOIS integration point:

```typescript
// Lines 144-157 - LOIS INTEGRATION POINT
} else {
  /**
   * LOIS INTEGRATION POINT
   * =====================
   *
   * When mode === 'live', this is where LOIS execution would occur.
   *
   * Available data for LOIS:
   * - params.mint: Token mint address (base58)
   * - params.symbol: Token symbol
   * - params.action: 'buy' | 'sell'
   * - params.priceSol/priceUsd: Current market price
   * - params.signals: Array of signals that triggered this
   * - params.confidence: Aggregate confidence (0-1)
   * - positionSizeSol: Recommended position size (confidence-scaled)
   * - event: Full TriggerEvent for audit trail
   *
   * LOIS would:
   * 1. Bind user context (user_id, wallet from session)
   * 2. Apply slippage/priority from user preferences
   * 3. Create Intent via NATS or direct API
   * 4. Handle execution, confirmation, MEV protection
   *
   * Autopilot does NOT handle:
   * - User authentication/wallet binding
   * - Slippage/priority fee configuration
   * - Transaction construction or submission
   * - MEV protection (Jito bundles)
   */
  event.reason = 'Live mode requires LOIS integration';
  event.triggered = false;
  paperTracker.recordEvent(event);

  return { triggered: false, reason: event.reason, event };
}
```

---

### Phase 3: Align Data Formats with LOIS Conventions

**File:** `src/trading/types.ts`

Ensure field naming and formats match LOIS:

| Autopilot Field | LOIS Convention | Status |
|-----------------|-----------------|--------|
| `mint` | `from_token_mint` / `to_token_mint` (base58) | ✓ Already compatible |
| `timestamp` | Unix microseconds | ⚠️ We use ms, add note |
| `action` | `'buy'` / `'sell'` | ✓ Compatible |
| `priceSol` | `Decimal` string | ⚠️ We use number, document |
| `confidence` | N/A (new for LOIS) | Document as autopilot-specific |

**Add type documentation:**

```typescript
/**
 * PaperTrade - Simulated trade record
 *
 * LOIS Compatibility Notes:
 * - mint: Base58 Solana address (same as LOIS from_token_mint/to_token_mint)
 * - timestamp: Unix milliseconds (LOIS uses microseconds - multiply by 1000)
 * - Prices are JS numbers (LOIS uses rust_decimal strings for precision)
 * - signalStrength/ruleSetId are autopilot-specific (not in LOIS Intent)
 *
 * Fields LOIS would add at execution time:
 * - user_id, telemetry_id (from authenticated session)
 * - signer_wallet (from user's wallet binding)
 * - slippage_bps, priority_fee (from user preferences)
 * - submitter_requests (JitoBundle, Rpc)
 */
export interface PaperTrade {
  // ... existing fields
}
```

---

### Phase 4: Add LOIS Integration README

**New File:** `src/trading/LOIS_INTEGRATION.md`

Create documentation for PUM3 team:

```markdown
# LOIS Integration Guide

## Overview

This document describes how to integrate token-analysis-autopilot with LOIS
for live trading execution.

## Architecture

Autopilot handles:
- Signal detection via rule engine
- Magic buy/exit at technical levels
- Market filter (SOL dump protection)
- Paper trade simulation

LOIS handles:
- User authentication & wallet binding
- Slippage/priority fee configuration
- Swap construction via PUM3 API
- Transaction submission (Jito/RPC)
- MEV protection

## Integration Points

### 1. TriggerEvent Subscription

Autopilot emits `TriggerEvent` when signals fire. LOIS can:
- Subscribe to these events (implementation TBD by PUM3 team)
- Convert to LOIS Intent format
- Execute via existing LOIS pipeline

### 2. Mode Switch

In `src/trading/trigger.ts:144`, the `mode === 'live'` branch is the
integration point. LOIS team can:
- Add NATS publish here, OR
- Call LOIS API directly, OR
- Use callback/event pattern

### 3. Data Mapping

| Autopilot TriggerEvent | LOIS Intent |
|------------------------|-------------|
| mint | from_token_mint (buy) or to_token_mint (sell) |
| action | Determines BuyDip vs StopLoss order type |
| confidence | Could influence position sizing |
| signals | New field - signal-based intent type |
| recommendedPositionSizeSol | amount_in (after conversion) |

### 4. New Intent Type Suggestion

Autopilot's signal-based approach differs from LOIS's threshold triggers.
Consider adding:

```rust
OrderConfig::SignalBasedEntry {
    signal_source: String,        // "autopilot"
    rule_set_id: String,
    confidence_threshold: f64,
    signals: Vec<SignalInfo>,
}
```

## What Autopilot Does NOT Provide

- user_id / telemetry_id (LOIS binds from session)
- signer_wallet (LOIS binds from user)
- slippage_bps (LOIS uses user preferences)
- priority_fee (LOIS uses user preferences)
- submitter_requests (LOIS decides Jito vs RPC)

## Questions for PUM3 Team

1. Preferred integration pattern? (NATS publish vs direct API vs callback)
2. New OrderConfig variant for signal-based entries?
3. How to handle position sizing? (Autopilot recommends, LOIS can override)
```

---

## Critical Files

| File | Action |
|------|--------|
| `src/trading/types.ts` | Enhance TriggerEvent, add LOIS compatibility docs |
| `src/trading/trigger.ts` | Document integration point at lines 144-157 |
| `src/trading/LOIS_INTEGRATION.md` | Create integration guide for PUM3 team |
| `src/trading/paper-tracker.ts` | Add compatibility notes to PaperTrade |

---

## What We're NOT Doing

1. ❌ Building NATS client or intent publishing
2. ❌ Creating ITradeExecutor abstraction
3. ❌ Adding user_id/wallet fields to paper trades
4. ❌ Handling slippage/priority configuration
5. ❌ Building LoisBridge or execution layer

---

## Success Criteria

1. TriggerEvent contains all context LOIS would need
2. Integration point is clearly documented
3. Data formats align with LOIS conventions (or differences documented)
4. PUM3 team can read LOIS_INTEGRATION.md and understand how to integrate
5. Paper trading remains clean and minimal
