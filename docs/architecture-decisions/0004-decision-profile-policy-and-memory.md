# ADR 0004: Decision profile, policy hierarchy, and memory

Status: Accepted  
Date: 2026-08-01

## Decision

Ara's personal decision profile is durable, editable, and distinct from observed memory. User-declared preferences are written with `source = declared_by_user` and full confidence. The policy hierarchy is organization rule, person rule, then task context; higher precedence wins within that hierarchy.

The constitution currently enforces three baseline rules: consequential external actions follow the configured authority policy, attention monitoring may act only within that authority, and declared goals override observed avoidance. Provider permission never overrides these rules.

## Consequences

- Ara can personalize without pretending inference is fact.
- Users can correct the decision profile directly.
- Memory provenance is preserved for future review, retention, and deletion controls.
