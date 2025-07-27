# App6 – Cartes i Pentagrama

Aquesta app combina el selector d'escales, les cartes manipulables i la representació en pentagrama.

## Ús

Serveix la carpeta amb un servidor local i obre `apps/app6/index.html`:

```bash
npx http-server
```

Selecciona l'escala i introdueix la seqüència de notes en format **eA** o **Ac**. Les cartes es poden rotar, duplicar o reordenar i el pentagrama reflecteix els canvis automàticament.

### Features

- Deu **presets** (A–J) per desar acords. Clica un botó per carregar-lo i usa **Guardar** per emmagatzemar l'acord actual. Els presets es poden arrossegar per reordenar, reiniciar, descarregar o carregar en JSON.
- Control de **tempo** amb BPM o el botó **Tap**. Pots **Gravar** les pulsacions sobre els acords del pentagrama (després d'un compte enrere de 4) i **Reproduir** la seqüència o exportar-la com a **MIDI**.
- Mantén **Shift** en clicar un acord per sentir-lo com un arpegi; amb **Alt+Shift** sona el doble de ràpid. Durant la gravació també es registra aquest mode.
- En mode **Armadura**, una línia vertical indica quan la tonalitat canvia entre presets guardats.
