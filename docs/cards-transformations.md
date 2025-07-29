## Card transformation helpers

The module `shared/cards.js` groups helpers to manipulate note-component pairs (cards) used by app5.

| Function | Description |
| -------- | ----------- |
| `generateComponents(notes)` | Generate component labels starting from `a` and reuse labels for repeated notes. |
| `ensureDuplicateComponents(notes, components)` | Align component labels so equal notes share the same label. |
| `transposeNotes(notes, len, delta)` | Transpose notes by `delta` steps modulo `len`. |
| `rotateLeft(notes, shifts, comps)` | Rotate card arrays to the left. |
| `rotateRight(notes, shifts, comps)` | Rotate card arrays to the right. |
| `shiftOct(octShifts, index, delta)` | Change the octave shift for one card. |
| `moveCards(state, indices, target, after?)` | Permute cards by moving a group before or after `target` depending on the optional `after` flag. Returns their new indices. |
| `duplicateCards(state, indices)` | Duplicate cards appending them at the end. Returns indices of the new cards. |
| `omitCards(state, indices)` | Remove the specified cards from the arrays. |
| `addCard(state, note, comp, shift?, index?)` | Insert a new card at the given index (or at the end). |

## `libs/cards` options

The UI helper `libs/cards/index.js` exposes `init(container, opts)` to create editable card rows.
When `opts.showIntervals` is `true`, input fields are inserted between cards so the
intervals can be edited directly. Changing a field updates `state.notes` accordingly.

Additional options:

- `draggable` – enable drag & drop to reorder cards (default `true`).
- `showShift` – display register arrows on each card (default `true`).
