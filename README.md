# HatchV1

## Checkpoint 1 — physical interaction

One seeded soft body, 24 skin nodes and 24 active inhabitants. Drag near the rim
or its bead; release to settle. Escape or pointer cancellation restores the
pre-grab state. Reset reproduces the initial state. Background tabs pause.
The body holds its pose during pulls; inhabitants continue moving and respond
reciprocally against the boundary. Resizing only changes the view.

Open `index.html` directly, or run `python3 -m http.server 8000` in this directory
and visit `http://localhost:8000`. No dependencies or build step.

## Checkpoint 2 — persistent reshaping

Meaningful releases now commit the current contour's preferred shape, edge
lengths and bending geometry without changing inhabitants or adding an impulse.
Restoration uses best-fit rigid alignment, so the new silhouette can translate
and rotate freely. Invalid releases restore the pre-grab snapshot and increment
`rejectedCommits`. Reset, Escape and cancellation include all rest geometry.

## Checkpoint 3 — polish and verification

All three implementation checkpoints are complete. Local pressure highlights use
actual reciprocal boundary impulses, with 30 ms rise / 140 ms decay. Grab shadow
and bead transitions respect reduced motion. The straight polygon remains the
collision and rendered contour. Sound initializes after a gesture: a quiet noise
tick, speed-dependent friction and a short falling release tone. The Sound button
mutes everything; unavailable or failing Web Audio does not block interaction.

Chromium VM verification: five simulated minutes (36,000 steps) and 100 small
mouse-driven pulls kept 24 inhabitants finite and contained, with zero recoveries
and zero rejected commits. Snapshot reset/cancellation, persistent silhouettes,
invalid-contour rejection and reciprocal contact checks passed. Mouse capture,
outside release, emulated touch, resize, visibility pause/resume, mute, and missing
or throwing AudioContext were exercised. Controlled contact momentum error was
6.82e-12; restoration net force and torque were below 1e-8 and 1e-7 respectively.

Over approximately five real seconds, 319 frame intervals measured p50 16.7 ms,
p95 16.8 ms. For 21 pointer moves, event-handler-to-next-render-frame callback
latency measured p50 0.5 ms / p95 0.9 ms. These are automated VM measurements,
not input-to-display photon latency or evidence of performance on real devices.
A held-grab screenshot was captured with state GRABBING before and after capture.
Audio has not been subjectively auditioned. Real-device testing and unfamiliar-
player product validation remain pending; no participants have been tested.
`window.__hatch` exposes simulation snapshots, manual stepping and view helpers
for repeatable browser checks.