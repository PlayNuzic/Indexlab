# App5 – Acordes y transformaciones

Build and play chord arrays in Nuzic notation. The interface lets you select scales, rotate modes and store snapshots of your progress.

## Usage

Start a local server and open `apps/app5/index.html`:

```bash
npx http-server
```

Visit the URL printed by the command and navigate to this app.

### Features

- Select a **scale**, its **rotation** and **root** from the drop-downs.
- Switch between **eA** (relative) or **Ac** (absolute) input using the tabs. In Ac mode you can transpose the sequence with the arrow buttons.
- Enter a sequence and press **Generar** to update the matrix.
- Use **Interval harmònic (iA)** to toggle melodic/harmonic playback of the cells.
- Hold **Shift** while clicking cells to invert the playback mode and **Alt** to play melodic intervals twice as fast.
- Ten **snapshot** slots store progress (long press to save, click to load). Snapshots can be reset, downloaded or uploaded.
- Set a tempo with **Tap** and **BPM**, then **Gravar** to record cell clicks. Use **Reproduir** to hear the sequence or **MIDI** to download it.
- The new **Mostra informació** button toggles a help card with details about the matrix.
- Hold the **Nm** button to display the modular notes on the diagonal.

## Shared Libraries

App5 relies on:

- `libs/shared-ui` for common styling
- `libs/sound` for audio playback
- utilities from the `shared` folder such as `scales.js` and `presets.js`

Run tests from the repository root with:

```bash
npm test
```

## Keyboard modifiers

While clicking on matrix cells you can hold **Shift** to switch between harmonic
(iA) and melodic (iS) playback. Each melodic note lasts one quarter note. Holding
**Alt** shortens them to eighth notes, effectively playing the interval twice as
fast. In harmonic mode press **Shift + Alt** for this accelerated playback.
