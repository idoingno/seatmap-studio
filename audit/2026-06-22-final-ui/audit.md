# Seatmap Studio UI and interaction audit

## Audit scope

Combined UX and accessibility review of the editor workspace on desktop and mobile. The user goal is to create, arrange, label, color, resize, and assign people to a seating layout without UI clipping or mouse-operation ambiguity.

## Steps

1. Empty desktop workspace - healthy after load. The resource library, canvas guidance, header actions, and zoom status are visible together.
2. Initial mobile workspace - needed improvement. The vertical material list hid the people section below an inconspicuous inner scroll area.
3. Populated matrix - healthy. The matrix is centered, the canvas remains dominant, and the layout container reads as one movable object.
4. Compact mobile resources - healthy. Materials now use a horizontal strip and the people-section entry is visible without scrolling the whole material catalog.
5. Loaded desktop roster - healthy. Real counts replace the loading state and the organization tree remains usable within the fixed sidebar.
6. Final compact mobile workspace - healthy. The canvas keeps its working height while both resource categories remain discoverable.
7. Round-table tools - healthy after fixes. The table, chairs, container, add, remove, and delete controls remain one visual and structural unit.
8. Person assignment card - healthy after fixes. The card uses the current paper-and-petrol visual language and is positioned from the graph's real client coordinates.

## Strengths

- The canvas is visually dominant and uses restrained planning-paper cues rather than decorative dashboard cards.
- Header actions, sidebar categories, canvas hints, zoom state, selected-seat count, and color tools have clear task roles.
- Matrix and round-table containers now move with their labels, seats, and table content.
- Desktop and mobile layouts preserve the same information architecture without horizontal page overflow.
- Focus-visible styles, semantic buttons, expanded states, live selection status, and reduced-motion handling cover the main controls.

## UX risks found and resolved

- Mobile resource discovery: replaced the tall two-column material catalog with a compact horizontal strip.
- Premature zero counts: person filters now show a loading state instead of briefly reporting an empty roster.
- Disabled material ambiguity: incompatible layout materials now expose disabled styling, text, and behavior.
- Round-table controls: fixed missing SVG classes, broken removal logic, and stale-query protection.
- Room-object tools: verified real mouse resize and deletion after leaving the transform state.
- Person information card: removed the legacy dark skin and old fixed sidebar offsets.
- Matrix hover tools: fixed their SVG targeting and removed closed X6 menu nodes that could intercept the next pointer action.
- Seat and roster flows: verified seat hide/restore, assigned-person seat transfer, search, person type, attendance, and seating-state filters.
- Project presentation: replaced the obsolete concept illustration with a current editor screenshot and documented the actual canvas controls.

## Accessibility risks found and resolved

- Added `aria-expanded` to resource sections.
- Converted the background-color trigger and region-name controls to keyboard-operable buttons.
- Added names and pressed states to color swatches.
- Added accessible disabled descriptions to unavailable materials.
- Added a live loading label for roster data.

## Evidence limits

- Screenshots and browser automation do not prove full WCAG conformance or screen-reader quality.
- Exact pixel fidelity to the selected ImageGen concept remains unverified because the source concept is not available as an exportable local image.
- Touch dragging on mobile was not treated as a supported replacement for desktop pointer dragging; mobile retains access to viewing and header workflows.

## Verification

- Desktop: 1440 x 1024.
- Mobile: 390 x 844.
- TypeScript check: passed.
- Production build: passed with the existing large asynchronous chunk warnings.
- Playwright E2E: 26 tests passed.
- Round-table bilingual rename stress test: 10 consecutive passes.
- Runtime checks cover template loading, matrix editing, selection, person assignment, round-table editing, room-object resize/delete, coloring, export, save, and responsive UI.
