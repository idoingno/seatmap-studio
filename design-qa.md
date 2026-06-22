# Design QA

Source visual truth: current-thread ImageGen result, concept 3 "Spatial Planning Desk" (selected by the user; no exportable filesystem path is available)
Implementation screenshot: `/tmp/seatmap-spatial-desktop-pass2.png`
Additional screenshots: `/tmp/seatmap-spatial-mobile-pass3.png`, `/tmp/seatmap-spatial-selected.png`, `/tmp/seatmap-spatial-add-menu.png`
Viewport: 1440 x 1024 desktop and 390 x 844 mobile
State: empty canvas, populated matrix, four-seat selection, add-row/column menu, mobile workspace

## Full-view comparison evidence

The implementation follows the selected direction's structural intent: a graphite command bar, compact resource library, paper-white dotted planning canvas, petrol-green interaction states, restrained brass accents, and a slim bottom status bar. The canvas is visually dominant and the previous pink/glass-card treatment is removed.

The selected ImageGen source is visible in the current thread but cannot be exported or programmatically captured. The Codex application blocks automated screen access, so a literal combined source-and-implementation comparison image could not be produced.

## Focused region evidence

- Header: actions remain reachable on desktop and mobile; mobile uses a second compact command row.
- Sidebar: draggable assets fit in a denser two-column library without clipping.
- Canvas: selection boxes, selected-count status, dot grid, zoom controls, color control, and add/remove menu remain legible.
- Responsive: the 390 px viewport has no horizontal overflow and the color control no longer covers the template action.
- Assets: existing project artwork and the established icon component are retained; no placeholder imagery or CSS-drawn replacement assets were introduced.

## Findings

- [P2] Source visual cannot be captured for the mandatory combined comparison.
  Evidence: the ImageGen result exists only as a thread-rendered asset, while automated access to the Codex window is denied.
  Impact: exact pixel-level fidelity against the selected concept cannot be formally proven.
  Fix: export or attach the selected concept image, then create a side-by-side comparison at 1440 x 1024.

## Patches made

- Rebuilt the shell around graphite, drafting gray, paper white, petrol green, and brass tokens.
- Compressed the header, sidebar assets, canvas labels, color tools, dialogs, and matrix menus.
- Added live zoom and selected-seat status.
- Added visible keyboard focus and reduced-motion handling.
- Added a canvas-boundary guard so cancelled or outside drops do not open layout dialogs.
- Preserved the no-transition X6 drag fix so matrix backgrounds and seats move as one unit.
- Restored loaded matrix and circle containers as movable nodes, and protected local moves from stale query refreshes.
- Embedded newly created matrix and circle children explicitly so backgrounds, labels, tables, and seats move as one unit.
- Protected material drops as soon as they enter the canvas, preventing an in-flight empty query from shifting or clearing a pending layout.
- Standardized material drop coordinates on viewport client coordinates and kept newly created layouts inside the visible canvas.
- Moved canvas panning to the middle mouse button so left-drag remains dedicated to layout movement and selection.
- Removed the personnel-tree mount reload that could race with a template drag and snap the layout back to its previous position.
- Restored mobile access to clear, Excel template, and seat upload actions.
- Aligned matrix, circle, stage, door, selection, and loaded-template colors with the new visual system.
- Reworked mobile materials into a compact horizontal resource strip so the people section remains discoverable.
- Replaced transient zero roster counts with an explicit loading state.
- Brought the assigned-person card and X6 delete controls into the same paper-and-petrol visual language.
- Fixed round-table add/remove tools, reliable bilingual renaming, and room-object resize/delete mouse flows.
- Added keyboard-operable panel, palette, and region-name controls with clear expanded, pressed, and disabled states.
- Fixed matrix hover-tool hit areas and removed closed menu nodes so rapid add/remove operations cannot block each other.
- Added verified seat hide/restore, assigned-person seat transfer, roster search, attendance filters, and a real editor screenshot for the project README.

## Verification

- TypeScript: passed.
- Production build: passed, with existing large-chunk warnings.
- Playwright E2E: 26 tests passed.
- Round-table bilingual rename stress test: 10 consecutive passes.
- Desktop and mobile screenshots: reviewed.
- Populated matrix, multi-selection, selected count, add-row/column menu, person drag-to-seat/card, round-table movement/tools/name editing, room-object drops/resize/delete, region coloring, and keyboard controls: reviewed.

## Follow-up polish

- P3: Consider replacing mixed English utility kickers with fully localized Chinese labels if the product will be Chinese-only.

final result: functional and responsive QA passed; exact pixel comparison remains unavailable because the selected source concept cannot be exported from the thread
