## app3 Functions

The following table summarises key helpers and UI utilities found in `apps/app3`.

| Function | Description |
| -------- | ----------- |
| `parseNums` | Parse whitespace separated numbers from a text string. |
| `eAToNotes` | Convert interval notation to note numbers modulo 12. |
| `notesToEA` | Translate note numbers back to interval notation. |
| `notesToAc` | Display note numbers as an absolute space separated list. |
| `toAbsolute` | Given relative notes and a base, return ascending MIDI values. |
| `buildMatrix` | Build the interval matrix used to render the grid. |
| `diagMidis` | Calculate MIDI notes along the main diagonal. |
| `renderGrid` | Draw the interactive interval matrix on screen. |
| `resizeMatrix` | Resize grid cells based on viewport size. |
| `saveSnapshot` | Save current notes to one of the 10 snapshot slots. |
| `loadSnapshot` | Restore notes and base MIDI from a snapshot slot. |
| `renderSnapshots` | Update the snapshot buttons to reflect saved slots. |
| `resetSnapshots` | Clear all snapshot slots. |
| `updatePlayMode` | Change text of the harmonic/melodic toggle. |
| `setHover` | Highlight cells corresponding to a hovered matrix cell. |
| `flashCell` | Briefly flash cells when they are played. |
| `stopPlayback` | Stop playback and clear scheduled timers. |
| `playSeq` | Play the recorded sequence of events. |
| `initSnapshots` | Initialize snapshot data from stored JSON. |
| `saveSnapshot` (SnapUtils) | Save notes and base MIDI into snapshot data. |
| `loadSnapshot` (SnapUtils) | Retrieve notes and base MIDI from snapshot data. |
| `resetSnapshots` (SnapUtils) | Produce a fresh snapshot array. |

