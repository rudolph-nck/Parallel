# Parallel risk register

Updated: 2026-07-31

| Risk | Impact | Likelihood | Current control | Next control |
| --- | --- | --- | --- | --- |
| Ara disconnects before a tool finishes | High | Medium | explicit tool results | lifecycle invariant and tests |
| Ara claims an action succeeded when it did not | High | Medium | prompt boundary and result fields | typed outcome contract and audit |
| Audio is cut off during autonomous close | High | Medium | none | wait for `output_audio_buffer.stopped` |
| Background noise is treated as approval | High | Medium | strict prompt and paused mic | deterministic approval state plus confirmation tests |
| Closing speech cannot be interrupted | Medium | Medium | none | short mic-enabled interruption window |
| Orphaned microphone/peer after errors | High | Medium | shared cleanup function | idempotent cleanup, timers, and final session receipt |
| Device-local audit exposes private metadata | Medium | Low | bounded browser storage | minimize content; migrate to encrypted tenant store |
| Prototype IDs are mistaken for tenant enforcement | High | Medium | documented placeholders | derive IDs from authenticated tenancy before multi-user release |
| Provider event shape changes | Medium | Low | tolerant optional fields | contract telemetry and integration tests |
| Usage is recorded without exact price | Medium | High | no invented cost | versioned server pricing and reconciliation |
| Premium model overuse | Medium | Medium | low voice reasoning | routing policy, budgets, and eval gate |
| Ara/Aura naming drifts across artifacts | Low | High | product decision documented | normalize new code and UX to Ara |
| Background monitoring expands permissions too early | High | Medium | out of Sprint 1 | threat model and least-privilege event adapters |
