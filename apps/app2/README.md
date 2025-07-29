# App2 – Ear Training Nuzic

A simple ear training game to practice melodic and harmonic intervals using Nuzic notation. Choose a level and mode and try to identify each interval played.

## Usage

Run a local server and open `apps/app2/index.html`:

```bash
npx http-server
```

Open the displayed URL in your browser and select this app.

### Features

- Two training modes: **iS** (melodic) and **iA** (harmonic).
- Ten difficulty levels with predefined interval sets.
- On each round you can replay the notes, pick the answer from quick buttons and see your score.
- After completing a level view a summary and choose to repeat or advance.
- Select the playback instrument (synth or piano).

## Shared Libraries

App2 loads instruments and playback functions from `libs/sound` and shares the base styles from `libs/shared-ui`.

Automated tests can be executed from the repository root with:

```bash
npm test
```
