# ADR 0001: Client lifecycle controller with a device-local prototype audit

Status: accepted for prototype

Date: 2026-07-31

## Context

The current voice connection and Microsoft action execution live in the browser. Parallel needs deterministic closure and evidence now, but does not yet have a shared tenant database.

## Decision

Add a pure, tested lifecycle policy module used by the Ara client. Record a bounded, content-minimized session receipt on the current device. The controller, not the model, decides when closing is safe.

## Consequences

- We can verify lifecycle behavior and capture provider usage without delaying on the future data platform.
- The audit is visible only on this device and is not a compliant multi-tenant ledger.
- Stable prototype identifiers are emitted to keep the migration shape explicit.
- Pricing is not hard-coded into the client; provider token usage is retained for later reconciliation.

## Replacement condition

Before external multi-user release, move session receipts to an authenticated, tenant-scoped, encrypted append-only store and replace prototype identity constants with server-issued values.
