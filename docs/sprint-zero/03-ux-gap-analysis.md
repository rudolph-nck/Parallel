# UX gap analysis

Prepared: 2026-08-03

## Preserve versus redesign

The current design language is an asset. The redesign preserves its visual calm while replacing journeys that expose setup, ask for trust too early, or make the user operate the system.

| Journey | Preserve | Redesign | Acceptance signal |
| --- | --- | --- | --- |
| First launch | Dark cinematic arrival, two bars, restrained motion, Ara-centered composition | Remove Microsoft as an entry gate; make the first visible state relational rather than administrative | User meets Ara before being asked to connect a system |
| First conversation | Live voice, interruption, concise responses | Replace stage-driven onboarding with curious conversation and quiet state capture | Ara answers the person before advancing product state |
| Understanding | Minimal canvas | Add a small, correctable “What I’m learning” view; never show private analytical notes | User can see and correct declared context without a profile form |
| Connections | Existing Microsoft visual treatment and secure provider redirect | Introduce one connection at a natural moment; explain what, why, limits, and revocation | User understands the exchange before consent |
| Observation | First-day read and evidence disclosure | Make read-only observation a real trust stage rather than immediate write-capable setup | No external writes during observation stage |
| Ara page | Centered Ara presence and live task canvas | Remove dashboard behavior and persistent operational clutter from the conversation surface | Only the current conversation and supporting evidence are visible |
| Today | Existing operating overview | Reduce anything that resembles a productivity score or second inbox | Today orients; it does not create pressure |
| Listening/thinking/acting | Parallel bars and stateful motion | Bind every state to real lifecycle events and provide reduced-motion equivalents | State is truthful with motion disabled |
| Pauses and interruption | Semantic VAD and barge-in | Tune around reflective pauses; make interruption recovery a lifecycle invariant | User can pause or interrupt without duplicate responses |
| Evidence | Calendar canvas, source links, approval views | Standardize progressive evidence and distinguish fact, inference, uncertainty, freshness | Every recommendation can reveal why without forcing detail |
| Approval | Natural language and one clear choice | Move authority decisions out of the prompt; show exact recipient, time, source, and consequence | No consequential action depends on hidden detail |
| Completion | Short varied closings | Make completion settle the canvas and close only after verified success | User leaves knowing what happened and what remains |
| Errors | Several clear Microsoft errors | Standardize trust repair: what failed, what did not happen, what is safe, next step | No vague “something went wrong” for material work |
| End of day | Today foundation | Add accounting for intentional waits and a genuine release state | User can leave confident nothing important was lost |
| Accessibility | Some ARIA and live regions | Complete keyboard, captions, transcript, contrast, zoom, reduced motion, and non-voice paths | All primary journeys have equivalent accessible paths |

## Foundation slice implemented

The first implementation slice preserves the existing look while changing the first-run structure:

1. The cinematic boot remains.
2. Microsoft no longer blocks entry into Parallel.
3. The initial Ara page carries the human promise before setup.
4. A quiet “What I’m learning” canvas reflects declared context.
5. Corrections remain available through voice or preferences.
6. Microsoft connection appears only when Ara brings it into the conversation.
7. The connection view explains context, limits, provider-owned sign-in, and revocation.

This is the foundation, not the completed journey. The next slice must enforce observation-only permissions in code and add user confirmation before learned context becomes durable preference memory.

## UX laws for implementation

- One meaningful thought or decision at a time.
- No setup interruption before relationship and purpose.
- No private coaching or hidden analytical notes on the main canvas.
- No claim without evidence.
- No motion without a real state.
- No approval without visible consequence.
- No completion without verified outcome.
- No error without a safe next step.
- No recovered time automatically converted into more work.
- No user leaves carrying more uncertainty than before.

