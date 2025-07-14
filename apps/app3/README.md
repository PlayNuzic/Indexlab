# App3 – Chord Array Generator

Build and play chord arrays in Nuzic notation. The interface lets you select scales, rotate modes and store snapshots of your progress.

## Usage

Start a local server and open `apps/app3/index.html`:

```bash
npx http-server
```

Visit the URL printed by the command and navigate to this app.

## Shared Libraries

App3 relies on:

- `libs/shared-ui` for common styling
- `libs/sound` for audio playback
- utilities from the `shared` folder such as `scales.js` and `presets.js`

Run tests from the repository root with:

```bash
npm test
```

## Keyboard modifiers

While clicking on matrix cells you can hold **Shift** to switch between harmonic
(iA) and melodic (iS) playback. Holding **Alt** makes melodic intervals play at
double speed. In harmonic mode you need to press **Shift + Alt** for the faster
melodic playback.
