## Entorn OpenAI Codex

Es pot fer push directament des de l’entorn de Codex:

1. A **Settings → Environments** (del teu repo de GitHub) crea un entorn i
   afegeix el secret `GITHUB_TOKEN` amb permisos **repo**.
2. Usa el `setup.sh` del repo per preparar Git, Node i enganxar el token.
3. Cada sessió de Codex quedarà llesta per a `git add`, `git commit` i
   `git push` (via HTTPS amb PAT).

Abans d'executar `setup.sh`, pots desactivar els proxies i forçar SSH sobre el
port 443 per evitar bloquejos de xarxa. Un fragment habitual és:

```bash
# Prepara entorn sense proxy i SSH sobre 443
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
git config --global --unset http.proxy  || true
git config --global --unset https.proxy || true

mkdir -p ~/.ssh
cat > ~/.ssh/config <<'EOF'
Host github.com
  HostName ssh.github.com
  Port 443
  User git
  IdentityFile ~/.ssh/id_ed25519
  StrictHostKeyChecking no
EOF
chmod 600 ~/.ssh/config

# Després el teu ./setup.sh o comandes git…
chmod +x setup.sh
```

Si la instal·lació amb `apt-get` falla per restriccions de xarxa, executa el
script amb `SKIP_APT=1 ./setup.sh` i assegura't que la variable d'entorn
`GITHUB_TOKEN` està definida.

> **Atenció**: un cop acaba el `setup.sh`, la sessió perd accés a Internet;
> per tant, totes les dependències han d’estar instal·lades dins del `setup.sh`.

## Servir els fitxers HTML

Els exemples del directori `apps` utilitzen mòduls ES. Si obres els fitxers
`html` directament (`file://`), el navegador pot bloquejar-los perquè els
mòduls requereixen un origen HTTP(S).

Des del directori arrel del repositori pots executar un petit servidor amb:

```bash
npx http-server
```

A continuació obre al navegador l'URL que indiqui la comanda (habitualment
`http://localhost:8080`).

## Apps

Aquest repositori conté quatre demos dins `apps/`:

- **app1** – Fraccions rítmiques i patrons cíclics.
- **app2** – Joc senzill d'entrenament auditiu amb notació Nuzic.
- **app3** – Generador d'arranjaments d'acords en notació Nuzic.
- **app4** – Aleatoritzador modular de melodies publicat a GitHub Pages.

Totes comparteixen els components i utilitats comuns que es troben a `libs/`
i al directori `shared/`. El mòdul `libs/notation` proporciona la
funcionalitat de dibuix d'intervals en pentagrama (simple o doble) perquè les
apps puguin reutilitzar-lo.
La manipulació de cartes (parell component-nota) es documenta a
[`docs/cards-transformations.md`](docs/cards-transformations.md).

### Gestió d'accidentals

El mòdul `libs/notation` converteix seqüències MIDI en notes amb
accidentals automàtics. A partir de la versió actual es detecta la
primera nota alterada d'una seqüència i es manté la preferència
per sostenits o bemolls fins que acaba la frase, seguint també les
regles per a terceres majors i menors per facilitar la lectura.

## Tests

Before running tests, execute `./setup.sh` once per session to install all
dependencies and configure Git. After that you can run the test suite with:

```bash
npm test
```
