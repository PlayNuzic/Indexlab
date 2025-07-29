# App1 – Fracciones Rítmicas

This demo explores rhythmic fractions and how they combine into cycles. Adjust the controls to generate patterns and hear the result.

## Usage

Serve the repository locally and open `apps/app1/index.html` in your browser:

```bash
npx http-server
```

Navigate to the URL shown by the command and open the app.

### Features

- Configure the main fraction with **n**, **d**, tempo (**V**) and total length (**Lg**).
- Optionally add a second fraction (**n₂**, **d₂**) to compare rhythmic cycles.
- Toggle **Metrónomo**, **Bucle&nbsp;Lg** or **Reducción a 1 Ciclo** while playing.
- Use **TAP** to set the BPM and start/stop playback with the main button.
- The **Ciclo** section lets you expand or reduce the total length with ± buttons and shows a circular visualization.
- The **Patrón temporal** section displays the full timeline for the current fractions.

## Shared Libraries

App1 uses the common CSS from `libs/shared-ui` to keep the style consistent across apps.

Tests for the shared utilities can be run from the repository root with:

```bash
npm test
```
