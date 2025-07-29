# Generador Modular de Melodías (aleatorizador)

Aplicació web autosuficient que permet generar, editar i escoltar patrons
melòdics de forma modular sobre qualsevol escala o mode. Es distribueix com
a **site estàtic** (tot és HTML + CSS + JS a l’arrel del repo) i es publica
automàticament a **GitHub Pages**:

> https://playnuzic.github.io/aleatorizador/

---

## Funcionalitats principals

| bloc | resum |
| ---- | ----- |
| **Motor de generació** | genera files de 8 notes a partir de vistes Na/Nm/Nº, intervals modulars o de grau. |
| **Editor in-place** | doble clic a una casella ➜ edició del valor; es recalculen notes posteriors. |
| **Escales i modes** | Rotació lliure de qualsevol mare (*Crom*, *Diat*, *Arm Menor*, etc.). |
| **Playback** | Synth bàsic amb *Web Audio*; botó ▶ per fila, BPM ajustable. |
| **Export MIDI** | Cada fila es pot descarregar com a fitxer .mid. |
| **Presets ràpids** | Barra de 8 memòries (Alt + clic esborra, Shift + clic desa). |
| **Paràmetres extres** | Probabilitat d'octava i opcions globals (`iR`, `caDif`, `rango`, `duplicates`, `start`). |

---

## Desenvolupament

1. Clonar i instal·lar depenències opcionals

   ```bash
   git clone https://github.com/PlayNuzic/aleatorizador.git
   cd aleatorizador
   npm ci   # opcional – només si vols executar tests o linter
   ```

2. Servidor local

   ```bash
   python3 -m http.server 8000
   ```

3. Tests

   ```bash
   npm test          # només conté un placeholder; Jest està al package.json
   ```

## Entorn OpenAI Codex

Es pot fer push directament des de l’entorn de Codex.

1. A Settings → Environments crea un entorn i afegeix el secret `GITHUB_TOKEN`
   amb permisos repo.
2. Utilitza el `setup.sh` del repo per preparar Git, Node i pinxar el token.
3. Cada sessió de Codex quedarà llesta per a git add/commit/push.

Recorda que, un cop acaba el `setup.sh`, la sessió perd accés a internet;
totes les dependències que necessitis s’han d’instal·lar dins del setup.

## Llicència

GPL-3.0 – © PlayNuzic
