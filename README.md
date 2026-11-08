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

Pending checkpoint 3: contact highlights, shadow, audio and its accessible toggle, performance
measurements, five-minute/100-pull verification and real-device testing.
Unfamiliar-player product validation is pending; no participants have been tested.
`window.__hatch` exposes simulation snapshots, manual stepping and view helpers
for repeatable browser checks.