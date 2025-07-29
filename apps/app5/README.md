# App5 – Acordes y transformaciones

Build and transform chord arrays in Nuzic notation. The interface lets you edit cards, rotate or duplicate them and manage presets.

## Usage

Start a local server and open `apps/app5/index.html`:

```bash
npx http-server
```

Visit the URL printed by the command and navigate to this app.

### Features

- Selector d'escala amb rotacions i arrel.
- Seqüències **eA** o **Ac** amb botó **Generar** i transposició.
- Cartes manipulables: rotar, duplicar, reordenar i reduir.
- Colors de notes i intervals i detecció de l'arrel.
- Deu presets (A–J) per desar, moure i exportar/importar en JSON.
- Control de tempo, gravació i reproducció o exportació a **MIDI**.
- Arpegi amb **Shift** o **Alt+Shift**.
- Mode **Armadura/Accidentals** al pentagrama.

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
