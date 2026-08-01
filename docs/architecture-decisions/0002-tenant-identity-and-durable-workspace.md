# ADR 0002: Tenant identity and durable workspace

Status: Accepted  
Date: 2026-08-01

## Decision

Parallel stores durable product state in Cloudflare D1. Every user-owned operational record carries `tenant_id`, `person_id`, `user_account_id`, and `ai_employee_id`. Requests derive these identifiers from the authenticated ChatGPT user when available; the private demo uses an explicit single-owner fallback.

The first schema includes tenants, people, user accounts, AI employees, ownership, decision profiles, policy rules, memory records, attention items, commitments, model invocations, and audit events. Every query that returns or changes user data includes a tenant and user predicate.

## Consequences

- Profile, governance, attention, commitments, and usage now survive browser changes.
- Browser storage remains only a temporary profile/session fallback.
- Before a multi-user or commercial launch, the fallback identity must be disabled and tenant membership enforcement must become mandatory.
