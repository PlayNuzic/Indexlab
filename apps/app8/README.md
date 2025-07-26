# App2 – Ear Training Nuzic

A simple ear training game to practice melodic and harmonic intervals using Nuzic notation. Choose a level and mode and try to identify each interval played.

## Usage

Run a local server and open `apps/app2/index.html`:

```bash
npx http-server
```

Open the displayed URL in your browser and select this app.

## Shared Libraries

App2 loads instruments and playback functions from `libs/sound` and shares the base styles from `libs/shared-ui`.

Automated tests can be executed from the repository root with:

```bash
npm test
```
